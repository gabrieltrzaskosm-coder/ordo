"use client";

import { useEffect, useRef, useState } from "react";
import {
  submitDiagnostic,
  type DiagnosticResult,
} from "@/app/actions/diagnostic";
import { calculateDiagnosticScore } from "@/lib/diagnostic-score";

const inputClass = "od-input";

type Option = { label: string };

type FormKey =
  | "restaurantName"
  | "ownerName"
  | "email"
  | "whatsapp"
  | "role"
  | "authority"
  | "profile"
  | "budget"
  | "need"
  | "waiters"
  | "goal";

type IdentityField = {
  key: FormKey;
  label: string;
  type: "text" | "email" | "tel";
  placeholder: string;
  autoComplete?: string;
};

type Step = {
  key: string;
  question: string;
  description?: string;
  type: "text" | "email" | "tel" | "options" | "identity" | "insight";
  placeholder?: string;
  autoComplete?: string;
  options?: Option[];
  fields?: IdentityField[];
};

const STEPS: Step[] = [
  {
    key: "need",
    question: "Qual problema mais impacta o lucro do seu restaurante hoje?",
    type: "options",
    options: [
      { label: "Atender mais rápido e aumentar a demanda" },
      { label: "Aumentar as receitas e lucros" },
      { label: "Ter mais clareza sobre vendas e lucros" },
      { label: "Evitar erros e retrabalhos nos pedidos" },
    ],
  },
  {
    key: "opportunity",
    question: "Já identificamos uma oportunidade para a sua operação.",
    description: "Essa é uma leitura inicial. As próximas respostas mostram o tamanho real do potencial.",
    type: "insight",
  },
  {
    key: "identity",
    question: "Onde devemos enviar sua leitura inicial?",
    description: "Agora que você já viu a oportunidade, deixe seus dados para receber o diagnóstico completo.",
    type: "identity",
    fields: [
      {
        key: "restaurantName",
        label: "Nome do restaurante",
        type: "text",
        placeholder: "Ex.: Bistrô Central",
      },
      {
        key: "ownerName",
        label: "Seu nome",
        type: "text",
        placeholder: "Como podemos chamar você?",
        autoComplete: "name",
      },
      {
        key: "email",
        label: "E-mail",
        type: "email",
        placeholder: "voce@restaurante.com.br",
        autoComplete: "email",
      },
      {
        key: "whatsapp",
        label: "WhatsApp",
        type: "tel",
        placeholder: "(11) 99999-9999",
        autoComplete: "tel",
      },
    ],
  },
  {
    key: "role",
    question: "Qual seu cargo?",
    type: "options",
    options: [{ label: "CEO" }, { label: "Gerente" }, { label: "Dono" }],
  },
  {
    key: "authority",
    question: "Você é responsável pela tomada de decisões no negócio?",
    type: "options",
    options: [
      { label: "Sim, a decisão é só minha" },
      { label: "Tenho um sócio, decidimos juntos" },
      { label: "Não, preciso consultar outras pessoas" },
    ],
  },
  {
    key: "profile",
    question: "Qual cenário mais parece com o seu restaurante?",
    type: "options",
    options: [
      { label: "Restaurante grande · alta demanda e fila" },
      { label: "Restaurante médio/pequeno · equipe pesa no faturamento" },
      { label: "Outro cenário" },
    ],
  },
  {
    key: "budget",
    question: "Quanto a equipe pesa hoje na sua receita?",
    type: "options",
    options: [
      { label: "Até 30%" },
      { label: "Entre 30% e 50%" },
      { label: "Entre 50% e 70%" },
      { label: "Mais de 70%" },
    ],
  },
  {
    key: "waiters",
    question: "Quantos garçons de salão você tem hoje?",
    type: "options",
    options: [{ label: "1" }, { label: "2-3" }, { label: "4 ou mais" }],
  },
  {
    key: "goal",
    question: "Qual resultado faria mais diferença no lucro do seu restaurante hoje?",
    type: "options",
    options: [
      { label: "Atender mais mesas sem contratar mais garçons" },
      { label: "Reduzir o custo da equipe sem perder velocidade" },
      { label: "Aumentar as vendas nos horários de pico" },
      { label: "Entender quanto o Ordo pode melhorar meus resultados" },
    ],
  },
];

function getOpportunityPreview(need: string) {
  switch (need) {
    case "Atender mais rápido e aumentar a demanda":
      return {
        title: "Seu maior ganho pode estar no ritmo do salão.",
        body: "Quando o cliente começa o pedido sozinho, a equipe ganha tempo para servir mais mesas nos horários de pico.",
      };
    case "Aumentar as receitas e lucros":
      return {
        title: "Existe uma oportunidade direta de recuperar margem.",
        body: "Vamos cruzar o ritmo dos pedidos, a equipe e os horários de pico para encontrar onde o caixa pode melhorar.",
      };
    case "Ter mais clareza sobre vendas e lucros":
      return {
        title: "Antes de cortar custos, precisamos enxergar o que vende.",
        body: "O diagnóstico organiza os dados da operação para mostrar quais decisões podem proteger sua margem.",
      };
    case "Evitar erros e retrabalhos nos pedidos":
      return {
        title: "Menos retrabalho pode liberar lucro sem aumentar a equipe.",
        body: "Pedidos mais completos chegam à cozinha em tempo real e reduzem correções, idas e voltas.",
      };
    default:
      return {
        title: "Vamos encontrar o ponto de maior impacto.",
        body: "Responda mais algumas perguntas para transformar essa primeira leitura em um diagnóstico do seu restaurante.",
      };
  }
}

export function DiagnosticForm() {
  const formRef = useRef<HTMLFormElement>(null);
  const [stepIndex, setStepIndex] = useState(0);
  const [result, setResult] = useState<DiagnosticResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [selectedNeed, setSelectedNeed] = useState("");
  const currentStep = STEPS[stepIndex];

  useEffect(() => {
    const firstControl = formRef.current?.querySelector<HTMLElement>(
      ".od-slide.is-active input:not(.od-honeypot)",
    ) ?? formRef.current?.querySelector<HTMLElement>(
      ".od-form-actions .od-form-submit:not([disabled])",
    );
    firstControl?.focus();
  }, [stepIndex]);

  function validateCurrentStep() {
    if (currentStep.type === "insight") {
      setError(null);
      return true;
    }

    if (currentStep.type === "identity") {
      for (const field of currentStep.fields ?? []) {
        const control = formRef.current?.elements.namedItem(field.key);
        if (!(control instanceof HTMLInputElement) || !control.value.trim()) {
          setError("Preencha todos os dados de identificação para continuar.");
          return false;
        }
        if (!control.checkValidity()) {
          setError("Confira o e-mail informado antes de continuar.");
          return false;
        }
      }

      setError(null);
      return true;
    }

    const control = formRef.current?.elements.namedItem(currentStep.key);
    if (!control) return false;

    const value =
      control instanceof RadioNodeList
        ? control.value
        : control instanceof HTMLInputElement
          ? control.value.trim()
          : "";

    if (!value) {
      setError(
        currentStep.type === "options"
          ? "Escolha uma opção para continuar."
          : "Preencha este campo para continuar.",
      );
      return false;
    }

    if (control instanceof HTMLInputElement && !control.checkValidity()) {
      setError("Confira este campo antes de continuar.");
      return false;
    }

    setError(null);
    return true;
  }

  function nextStep() {
    if (!validateCurrentStep()) return;
    setStepIndex((current) => Math.min(current + 1, STEPS.length - 1));
  }

  function previousStep() {
    setError(null);
    setStepIndex((current) => Math.max(current - 1, 0));
  }

  async function submit(formData: FormData) {
    if (!validateCurrentStep()) return;

    setPending(true);
    setResult(null);
    setError(null);

    const localAnalysis = calculateDiagnosticScore({
      role: String(formData.get("role") ?? ""),
      authority: String(formData.get("authority") ?? ""),
      profile: String(formData.get("profile") ?? ""),
      budget: String(formData.get("budget") ?? ""),
      need: String(formData.get("need") ?? ""),
      waiters: String(formData.get("waiters") ?? ""),
      goal: String(formData.get("goal") ?? ""),
    });

    try {
      const response = await submitDiagnostic(formData);
      setResult({
        ...response,
        analysis: response.analysis ?? localAnalysis,
      });
    } catch (submissionError) {
      console.error("Erro ao registrar o diagnóstico", submissionError);
      setResult({
        ok: false,
        message: "Sua análise foi preparada, mas não conseguimos registrar o envio agora.",
        analysis: localAnalysis,
      });
    } finally {
      setPending(false);
    }
  }

  if (result?.ok) {
    const analysis = result.analysis;

    return (
      <div className={`od-diagnostic-result ${result.ok ? "is-success" : "is-warning"}`} role="status" aria-live="polite">
        <span className="od-result-kicker">Seu diagnóstico ORDO</span>
        <span className="od-success-mark" aria-hidden="true">✓</span>
        {analysis ? (
          <>
            <strong className="od-result-score">{analysis.adherence}%</strong>
            <h3>de aderência estimada ao ORDO</h3>
            <p className="od-result-highlight">
              Seu cenário indica uma oportunidade de melhorar o resultado conforme a operação ganha ritmo e reduz retrabalho.
            </p>
            <div className="od-result-projections" aria-label="Perspectiva estimada de aumento de lucros">
              <div>
                <strong>{analysis.profitPerspectiveFirstMonth}%</strong>
                <span>no primeiro mês</span>
              </div>
              <div>
                <strong>{analysis.profitPerspectiveSecondMonth}%</strong>
                <span>no segundo mês</span>
              </div>
            </div>
            <p className="od-result-note">Estimativa inicial baseada nas suas respostas, não uma promessa de resultado.</p>
          </>
        ) : (
          <>
            <h3>Diagnóstico recebido.</h3>
            <p className="od-result-highlight">Suas respostas foram registradas e nossa equipe vai preparar a análise da sua operação.</p>
          </>
        )}
        <p className="od-result-message">{result.message}</p>
      </div>
    );
  }

  return (
    <form ref={formRef} action={submit} className="od-form" aria-describedby={error || (result && !result.ok) ? "diagnostic-form-error" : undefined}>
      <div className="od-form-heading">
        <span className="od-form-kicker">Diagnóstico gratuito · 2 minutos</span>
        <div className="od-form-progress" aria-live="polite">
          <span>Passo {stepIndex + 1} de {STEPS.length}</span>
          <span className="od-form-progress-track" role="progressbar" aria-valuemin={1} aria-valuemax={STEPS.length} aria-valuenow={stepIndex + 1} aria-label={`Passo ${stepIndex + 1} de ${STEPS.length}`}>
            <span style={{ width: `${((stepIndex + 1) / STEPS.length) * 100}%` }} />
          </span>
        </div>
        <h3>Descubra onde seu restaurante está perdendo ritmo e lucro.</h3>
        <p>Começamos pelo principal desafio. Depois, uma pergunta por vez para encontrar onde o Ordo pode aliviar sua operação.</p>
      </div>

      <div className="od-carousel" aria-live="polite">
        {STEPS.map((step, index) => (
          <div
            className={`od-slide ${index === stepIndex ? "is-active" : ""}`}
            key={step.key}
            hidden={index !== stepIndex}
            aria-hidden={index !== stepIndex}
          >
            <div className="od-slide-question">
              <span className="od-slide-number">{String(index + 1).padStart(2, "0")}</span>
              <div>
                <h4 id={`diagnostic-question-${step.key}`}>{step.question}</h4>
                {step.description && <p>{step.description}</p>}
              </div>
            </div>

            {step.type === "identity" ? (
              <div className="od-identity-grid">
                {step.fields?.map((field, fieldIndex) => (
                  <label key={field.key}>
                    {field.label}
                    <input
                      className={inputClass}
                      id={field.key}
                      name={field.key}
                      type={field.type}
                      required
                      placeholder={field.placeholder}
                      autoComplete={field.autoComplete}
                      autoFocus={index === stepIndex && fieldIndex === 0}
                    />
                  </label>
                ))}
              </div>
            ) : step.type === "insight" ? (
              <div className="od-insight-card" role="status" aria-live="polite">
                {(() => {
                  const preview = getOpportunityPreview(selectedNeed);
                  return (
                    <>
                      <span className="od-insight-kicker">Leitura preliminar</span>
                      <strong>{preview.title}</strong>
                      <p>{preview.body}</p>
                      <span className="od-insight-note">Agora vamos medir o tamanho dessa oportunidade no seu restaurante.</span>
                    </>
                  );
                })()}
              </div>
            ) : step.type === "options" ? (
              <fieldset className="od-option-fieldset" aria-labelledby={`diagnostic-question-${step.key}`}>
                <legend className="od-sr-only">{step.question}</legend>
                <div className="od-option-list">
                  {step.options?.map((option, optionIndex) => (
                    <label className="od-option" key={option.label} htmlFor={`${step.key}-${optionIndex}`}>
                      <input
                        id={`${step.key}-${optionIndex}`}
                        type="radio"
                        name={step.key}
                        value={option.label}
                        required={optionIndex === 0}
                        onChange={step.key === "need" ? (event) => setSelectedNeed(event.target.value) : undefined}
                      />
                      <span>{option.label}</span>
                      <i aria-hidden="true">→</i>
                    </label>
                  ))}
                </div>
              </fieldset>
            ) : (
              <input
                className={inputClass}
                name={step.key}
                type={step.type}
                required
                placeholder={step.placeholder}
                autoComplete={step.autoComplete}
                autoFocus={index === stepIndex}
              />
            )}
          </div>
        ))}
      </div>

      <input className="od-honeypot" name="website" tabIndex={-1} autoComplete="off" aria-hidden="true" />

      {(error || (result && !result.ok)) && (
        <div id="diagnostic-form-error" className="od-form-error" role="alert">
          <span>{error ?? (result && !result.ok ? result.message : "")}</span>
          {result && !result.ok && !pending && (
            <button className="od-form-retry" type="button" onClick={() => { setResult(null); setError(null); }}>
              Tentar novamente
            </button>
          )}
        </div>
      )}

      <div className="od-form-actions">
        {stepIndex > 0 ? (
          <button className="od-form-back" type="button" onClick={previousStep} disabled={pending}>
            Voltar
          </button>
        ) : <span aria-hidden="true" />}
        {stepIndex === STEPS.length - 1 ? (
          <button className="od-form-submit" type="submit" disabled={pending}>
            {pending ? "Enviando diagnóstico…" : "Quero meu diagnóstico"}
            <span aria-hidden="true">→</span>
          </button>
        ) : (
          <button className="od-form-submit" type="button" onClick={nextStep}>
            Continuar
            <span aria-hidden="true">→</span>
          </button>
        )}
      </div>
      <p className="od-form-note">Sem compromisso. Seus dados serão usados apenas para retornar o diagnóstico.</p>
    </form>
  );
}
