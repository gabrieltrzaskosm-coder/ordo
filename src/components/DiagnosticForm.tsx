"use client";

import { useState } from "react";
import {
  submitDiagnostic,
  type DiagnosticResult,
} from "@/app/actions/diagnostic";

const inputClass = "od-input";

export function DiagnosticForm() {
  const [result, setResult] = useState<DiagnosticResult | null>(null);
  const [pending, setPending] = useState(false);

  async function submit(formData: FormData) {
    setPending(true);
    setResult(null);
    const response = await submitDiagnostic(formData);
    setResult(response);
    setPending(false);
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
    <form action={submit} className="od-form">
      <div className="od-form-heading">
        <span className="od-form-kicker">Diagnóstico gratuito · 2 minutos</span>
        <h3>Descubra onde seu restaurante está perdendo ritmo e lucro.</h3>
        <p>Responda algumas perguntas. Nós mostramos onde o Ordo pode aliviar a operação.</p>
      </div>

      <div className="od-form-grid">
        <label>
          Nome do restaurante
          <input className={inputClass} name="restaurantName" required placeholder="Ex.: Bistrô Central" />
        </label>
        <label>
          Seu nome
          <input className={inputClass} name="ownerName" required placeholder="Como podemos chamar você?" />
        </label>
        <label>
          E-mail
          <input className={inputClass} name="email" type="email" required placeholder="voce@restaurante.com.br" />
        </label>
        <label>
          WhatsApp
          <input className={inputClass} name="whatsapp" type="tel" required placeholder="(11) 99999-9999" />
        </label>
      </div>

      <div className="od-form-grid">
        <label>
          Qual cenário mais parece com o seu?
          <select className={inputClass} name="profile" required defaultValue="">
            <option value="" disabled>Selecione uma opção</option>
            <option>Restaurante grande · alta demanda e fila</option>
            <option>Restaurante médio/pequeno · equipe pesa no faturamento</option>
            <option>Outro cenário</option>
          </select>
        </label>
        <label>
          Qual é o seu papel?
          <select className={inputClass} name="authority" required defaultValue="">
            <option value="" disabled>Selecione uma opção</option>
            <option>Sou dono(a) e decido sozinho</option>
            <option>Sou sócio(a) e participo da decisão</option>
            <option>Sou gerente e recomendo a solução</option>
          </select>
        </label>
        <label>
          Quanto a equipe pesa hoje na receita?
          <select className={inputClass} name="budget" required defaultValue="">
            <option value="" disabled>Selecione uma faixa</option>
            <option>Até 30%</option>
            <option>Entre 30% e 50%</option>
            <option>Entre 50% e 70%</option>
            <option>Mais de 70% ou não sei calcular</option>
          </select>
        </label>
        <label>
          Qual é o maior desafio agora?
          <select className={inputClass} name="need" required defaultValue="">
            <option value="" disabled>Selecione uma opção</option>
            <option>Atender mais rápido nos horários de pico</option>
            <option>Reduzir dependência de novos atendentes</option>
            <option>Evitar erros e retrabalho nos pedidos</option>
            <option>Ter mais clareza sobre vendas e lucro</option>
          </select>
        </label>
      </div>

      <label>
        Quando você gostaria de melhorar essa operação?
        <select className={inputClass} name="timing" required defaultValue="">
          <option value="" disabled>Selecione uma opção</option>
          <option>O quanto antes</option>
          <option>Nos próximos 30 dias</option>
          <option>Nos próximos 3 meses</option>
          <option>Ainda estou pesquisando</option>
        </select>
      </label>

      <input className="od-honeypot" name="website" tabIndex={-1} autoComplete="off" aria-hidden="true" />

      {result && !result.ok && (
        <p className="od-form-error" role="alert">{result.message}</p>
      )}
      <button className="od-form-submit" type="submit" disabled={pending}>
        {pending ? "Enviando diagnóstico…" : "Quero meu diagnóstico"}
        <span aria-hidden="true">→</span>
      </button>
      <p className="od-form-note">Sem compromisso. Seus dados serão usados apenas para retornar o diagnóstico.</p>
    </form>
  );
}
