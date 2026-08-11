"use client";

// Fundo animado do login: "fios" fanados em WebGL (shader), portado do design.
// A lib `ogl` vem bundled (import local) — o original carregava-a de um CDN, que
// a CSP bloquearia. Congela em prefers-reduced-motion e pausa fora de vista.
import { useEffect, useRef } from "react";
import { Renderer, Program, Mesh, Triangle } from "ogl";

const vertex = `
attribute vec2 uv;
attribute vec2 position;
varying vec2 vUv;
void main(){ vUv = uv; gl_Position = vec4(position, 0.0, 1.0); }
`;

const fragment = `
precision highp float;
#define PI 3.14159265359
uniform float iTime;
uniform vec3 iResolution;
uniform vec3 uColor1;
uniform vec3 uColor2;
uniform vec3 uColor3;
uniform float uSpeed;
uniform float uThreadCount;
uniform float uFrequency;
uniform float uSpread;
uniform float uTaper;
uniform float uPosition;
uniform float uFanMode;
uniform float uGlow;
uniform float uFalloff;
uniform float uThickness;
uniform float uBrightness;
uniform float uOpacity;
uniform bool  uMirror;
uniform bool  uGrain;
uniform float uGrainIntensity;
uniform bool  uMouseInteraction;
uniform float uMouseStrength;
uniform vec2  uMouse;
varying vec2 vUv;

float hash21(vec2 p){
  vec3 p3 = fract(vec3(p.xyx) * 0.1031);
  p3 += dot(p3, p3.yzx + 33.33);
  return fract((p3.x + p3.y) * p3.z);
}

void addThread(inout vec3 accum, inout float cov, float y, float x, float uvy, float taperW, vec3 c){
  float w = (uThickness * 0.006) * max(taperW, 0.02);
  float d = abs(uvy - y);
  float line = smoothstep(w, 0.0, d);
  float glow = uGlow > 0.0 ? exp(-d / (uGlow * 0.7 + 0.0005)) * pow(taperW, uFalloff) : 0.0;
  accum += c * line + uColor3 * line * 0.35 + c * glow;
  cov += line + glow * 0.6;
}

void main(){
  vec2 uv = vUv;
  float x = uv.x;
  float N = uThreadCount;
  float mouseY = uMouseInteraction ? (uMouse.y - 0.5) * uMouseStrength : 0.0;
  float mousePhase = uMouseInteraction ? (uMouse.x - 0.5) * uMouseStrength * 2.0 : 0.0;

  float fan = uFanMode > 0.5 ? x : abs(x - 0.5) * 2.0;
  float amp = uSpread * (0.25 + 0.75 * fan);
  float taperW = mix(1.0, sin(x * PI), clamp(uTaper, 0.0, 1.0));

  vec3 accum = vec3(0.0);
  float cov = 0.0;
  for(int i = 0; i < 32; i++){
    if(float(i) >= N) break;
    float fi = float(i);
    float t = N > 1.0 ? fi / (N - 1.0) : 0.5;
    float centered = t - 0.5;
    float phase = fi * 0.7 + mousePhase;
    float wave = sin(x * uFrequency * 2.0 * PI + iTime * uSpeed * 2.0 * PI + phase);
    float y = uPosition + centered * uSpread * 0.6 + wave * amp + mouseY * (0.3 + fan);
    vec3 c = mix(uColor1, uColor2, t);
    addThread(accum, cov, y, x, uv.y, taperW, c);
    if(uMirror){
      float ym = 2.0 * uPosition - y;
      addThread(accum, cov, ym, x, uv.y, taperW, c);
    }
  }

  vec3 color = accum * uBrightness;
  float alpha = clamp(cov, 0.0, 1.0) * uOpacity;
  if(uGrain){
    float g = hash21(gl_FragCoord.xy + mod(iTime, 64.0) * 11.0);
    alpha += (g - 0.5) * uGrainIntensity;
  }
  alpha = clamp(alpha, 0.0, 1.0);
  gl_FragColor = vec4(color, alpha);
}
`;

const hexToRgb = (hex: string): [number, number, number] => {
  const r = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!r) return [1, 1, 1];
  return [
    parseInt(r[1], 16) / 255,
    parseInt(r[2], 16) / 255,
    parseInt(r[3], 16) / 255,
  ];
};

export function GradientWaves() {
  const hostRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const renderer = new Renderer({
      alpha: true,
      premultipliedAlpha: false,
      antialias: true,
      dpr: Math.min(window.devicePixelRatio || 1, 2),
    });
    const gl = renderer.gl;
    gl.clearColor(0, 0, 0, 0);
    const canvas = gl.canvas as HTMLCanvasElement;
    canvas.style.width = "100%";
    canvas.style.height = "100%";
    canvas.style.display = "block";
    host.appendChild(canvas);

    const program = new Program(gl, {
      vertex,
      fragment,
      transparent: true,
      uniforms: {
        iTime: { value: 0 },
        iResolution: { value: [1, 1, 1] },
        uColor1: { value: hexToRgb("#c14a2e") },
        uColor2: { value: hexToRgb("#e0894a") },
        uColor3: { value: hexToRgb("#fff2e6") },
        uSpeed: { value: 0.2 },
        uThreadCount: { value: 6 },
        uFrequency: { value: 5 },
        uSpread: { value: 0.18 },
        uTaper: { value: 1 },
        uPosition: { value: 0.5 },
        uFanMode: { value: 0 },
        uGlow: { value: 0.02 },
        uFalloff: { value: 0.6 },
        uThickness: { value: 1.1 },
        uBrightness: { value: 0.6 },
        uOpacity: { value: 1 },
        uMirror: { value: true },
        uGrain: { value: true },
        uGrainIntensity: { value: 0.05 },
        uMouseInteraction: { value: !reduce },
        uMouseStrength: { value: 0.3 },
        uMouse: { value: [0.5, 0.5] },
      },
    });
    const mesh = new Mesh(gl, { geometry: new Triangle(gl), program });

    const setSize = () => {
      const rect = host.getBoundingClientRect();
      renderer.setSize(
        Math.max(1, Math.floor(rect.width)),
        Math.max(1, Math.floor(rect.height)),
      );
      program.uniforms.iResolution.value = [
        gl.canvas.width,
        gl.canvas.height,
        gl.canvas.width / gl.canvas.height,
      ];
      renderer.render({ scene: mesh });
    };
    const ro = new ResizeObserver(setSize);
    ro.observe(host);
    setSize();

    const target = [0.5, 0.5];
    const cur = [0.5, 0.5];
    let onMove: ((e: PointerEvent) => void) | null = null;
    if (!reduce) {
      onMove = (e: PointerEvent) => {
        const rect = canvas.getBoundingClientRect();
        target[0] = (e.clientX - rect.left) / rect.width;
        target[1] = 1 - (e.clientY - rect.top) / rect.height;
      };
      window.addEventListener("pointermove", onMove);
    }

    if (reduce) {
      program.uniforms.iTime.value = 4.0;
      renderer.render({ scene: mesh });
      return () => {
        ro.disconnect();
        canvas.remove();
      };
    }

    let raf = 0;
    let visible = true;
    let pageVisible = !document.hidden;
    const loop = (t: number) => {
      program.uniforms.iTime.value = t * 0.001;
      cur[0] += 0.06 * (target[0] - cur[0]);
      cur[1] += 0.06 * (target[1] - cur[1]);
      program.uniforms.uMouse.value[0] = cur[0];
      program.uniforms.uMouse.value[1] = cur[1];
      renderer.render({ scene: mesh });
      raf = requestAnimationFrame(loop);
    };
    const start = () => {
      if (visible && pageVisible && raf === 0) raf = requestAnimationFrame(loop);
    };
    const stop = () => {
      if (raf) {
        cancelAnimationFrame(raf);
        raf = 0;
      }
    };
    const io = new IntersectionObserver(
      ([e]) => {
        visible = e.isIntersecting;
        if (visible) start();
        else stop();
      },
      { threshold: 0 },
    );
    io.observe(host);
    const onVis = () => {
      pageVisible = !document.hidden;
      if (pageVisible) start();
      else stop();
    };
    document.addEventListener("visibilitychange", onVis);
    start();

    return () => {
      stop();
      ro.disconnect();
      io.disconnect();
      document.removeEventListener("visibilitychange", onVis);
      if (onMove) window.removeEventListener("pointermove", onMove);
      try {
        gl.getExtension("WEBGL_lose_context")?.loseContext();
      } catch {
        // ignora
      }
      canvas.remove();
    };
  }, []);

  return (
    <div
      ref={hostRef}
      aria-hidden
      style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }}
    />
  );
}
