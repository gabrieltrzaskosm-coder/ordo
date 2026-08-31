import type { CSSProperties, ReactNode } from "react";

type BannerProps = {
  message: ReactNode;
  height?: string;
  variant?: "default" | "rainbow";
  className?: string;
};

/** Faixa compacta para avisos e contexto visual de uma área da aplicação. */
export function Banner({
  message,
  height = "2rem",
  variant = "default",
  className = "",
}: BannerProps) {
  const style = { "--banner-height": height } as CSSProperties;

  return (
    <div
      className={`ui-banner ui-banner-${variant} ${className}`.trim()}
      style={style}
      role="status"
    >
      <span className="ui-banner-mark" aria-hidden="true" />
      <span className="ui-banner-message">{message}</span>
    </div>
  );
}

