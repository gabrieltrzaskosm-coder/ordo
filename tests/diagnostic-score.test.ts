import { describe, expect, it } from "vitest";
import { calculateDiagnosticScore } from "@/lib/diagnostic-score";

const hotAnswers = {
  role: "Dono",
  authority: "Sim, a decisão é só minha",
  profile: "Restaurante grande · alta demanda e fila",
  budget: "Mais de 70%",
  need: "Aumentar as receitas e lucros",
  waiters: "4 ou mais",
  goal: "Reduzir o custo da equipe sem perder velocidade",
};

const coldAnswers = {
  role: "Gerente",
  authority: "Não, preciso consultar outras pessoas",
  profile: "Outro cenário",
  budget: "Até 30%",
  need: "Evitar erros e retrabalhos nos pedidos",
  waiters: "1",
  goal: "Entender quanto o Ordo pode melhorar meus resultados",
};

describe("calculateDiagnosticScore", () => {
  it("gera a maior aderência para respostas quentes", () => {
    const result = calculateDiagnosticScore(hotAnswers);

    expect(result.adherence).toBe(100);
    expect(result.profitPerspectiveFirstMonth).toBe(26);
    expect(result.profitPerspectiveSecondMonth).toBe(162);
    expect(result.lead).toBe("Lead Quente");
  });

  it("gera a menor aderência para respostas frias", () => {
    const result = calculateDiagnosticScore(coldAnswers);

    expect(result.adherence).toBe(20);
    expect(result.profitPerspectiveFirstMonth).toBe(8);
    expect(result.profitPerspectiveSecondMonth).toBe(50);
    expect(result.lead).toBe("Lead Frio");
  });
});
