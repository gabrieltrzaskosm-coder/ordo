"use client";

import { useRef, useState } from "react";
import {
  submitDiagnostic,
  type DiagnosticResult,
} from "@/app/actions/diagnostic";

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
  type: "text" | "email" | "tel" | "options" | "identity";
  placeholder?: string;
  autoComplete?: string;
  options?: Option[];
  fields?: IdentityField[];
};

const STEPS: Step[] = [
  {
    key: "identity",
    question: "Antes de começar, conte quem está por trás da operação.",
    description: "Esses dados nos ajudam a preparar um diagnóstico para o seu restaurante.",
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
    key: "need",
    question: "Qual é o maior desafio agora?",
    type: "options",
    options: [
      { label: "Atender mais rápido e aumentar a demanda" },
      { label: "Aumentar as receitas e lucros" },
      { label: "Ter mais clareza sobre vendas e lucros" },
      { label: "Evitar erros e retrabalhos nos pedidos" },
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

export function DiagnosticForm() {
  const formRef = useRef<HTMLFormElement>(null);
  const [stepIndex, setStepIndex] = useState(0);
  const [result, setResult] = useState<DiagnosticResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const currentStep = STEPS[stepIndex];

  function validateCurrentStep() {
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
    const response = await submitDiagnostic(formData);
    setResult(response);
    setPending(false);
  }

  if (result?.analysis) {
    const analysis = result.analysis;

    return (
      <div className={`od-diagnostic-result ${result.ok ? "is-success" : "is-warning"}`} role="status" aria-live="polite">
        <span className="od-result-kicker">Seu diagnóstico ORDO</span>
        <strong className="od-result-score">{analysis.adherence}%</strong>
        <h3>de aderência para usar o ORDO</h3>
        <p className="od-result-highlight">
          Seu negócio tem uma perspectiva estimada de aumento de lucros com o ORDO, conforme a operação ganha ritmo e reduz custos de equipe.
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
        <p className="od-result-note">Essa é uma estimativa inicial baseada nas suas respostas, não uma promessa de resultado.</p>
        {result.ok ? (
          <p className="od-result-message">{result.message}</p>
        ) : (
          <p className="od-form-error" role="alert">{result.message}</p>
        )}
      </div>
    );
  }

  if (result?.ok) {
    return (
      <div className="od-form-success" role="status" aria-live="polite">
        <span className="od-success-mark" aria-hidden="true">✓</span>
        <h3>Diagnóstico recebido.</h3>
        <p>{result.message}</p>
      </div>
    );
  }

  return (
    <form ref={formRef} action={submit} className="od-form">
      <div className="od-form-heading">
        <span className="od-form-kicker">Diagnóstico gratuito · 2 minutos</span>
        <div className="od-form-progress" aria-live="polite">
          <span>Passo {stepIndex + 1} de {STEPS.length}</span>
          <span className="od-form-progress-track" aria-hidden="true">
            <span style={{ width: `${((stepIndex + 1) / STEPS.length) * 100}%` }} />
          </span>
        </div>
        <h3>Descubra onde seu restaurante está perdendo ritmo e lucro.</h3>
        <p>Começamos com seus dados. Depois, uma pergunta por vez para encontrar onde o Ordo pode aliviar sua operação.</p>
      </div>

      <div className="od-carousel" aria-live="polite">
        {STEPS.map((step, index) => (
          <div
            className="od-slide"
            key={step.key}
            hidden={index !== stepIndex}
            aria-hidden={index !== stepIndex}
          >
            <div className="od-slide-question">
              <span className="od-slide-number">{String(index + 1).padStart(2, "0")}</span>
              <div>
                <h4>{step.question}</h4>
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
            ) : step.type === "options" ? (
              <div className="od-option-list">
                {step.options?.map((option, optionIndex) => (
                  <label className="od-option" key={option.label}>
                    <input
                      type="radio"
                      name={step.key}
                      value={option.label}
                      required={optionIndex === 0}
                    />
                    <span>{option.label}</span>
                    <i aria-hidden="true">→</i>
                  </label>
                ))}
              </div>
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

      {error && <p className="od-form-error" role="alert">{error}</p>}
      {result && !result.ok && (
        <p className="od-form-error" role="alert">{result.message}</p>
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
