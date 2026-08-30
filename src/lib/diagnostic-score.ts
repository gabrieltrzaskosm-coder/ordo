export type LeadTemperature = "Quente" | "Morno" | "Frio";

export type ScoredField =
  | "role"
  | "authority"
  | "profile"
  | "budget"
  | "need"
  | "waiters"
  | "goal";

export type DiagnosticAnswers = Partial<Record<ScoredField, string>>;

export type DiagnosticAnalysis = {
  adherence: number;
  profitPerspective: number;
  lead: `Lead ${LeadTemperature}`;
  breakdown: Record<ScoredField, LeadTemperature>;
};

const SCORED_FIELDS: ScoredField[] = [
  "role",
  "authority",
  "profile",
  "budget",
  "need",
  "waiters",
  "goal",
];

const TEMPERATURE_BY_ANSWER: Record<ScoredField, Record<string, LeadTemperature>> = {
  role: {
    CEO: "Quente",
    Gerente: "Frio",
    Dono: "Quente",
  },
  authority: {
    "Sim, a decisão é só minha": "Quente",
    "Tenho um sócio, decidimos juntos": "Morno",
    "Não, preciso consultar outras pessoas": "Frio",
  },
  profile: {
    "Restaurante grande · alta demanda e fila": "Quente",
    "Restaurante médio/pequeno · equipe pesa no faturamento": "Quente",
    "Outro cenário": "Frio",
  },
  budget: {
    "Até 30%": "Frio",
    "Entre 30% e 50%": "Morno",
    "Entre 50% e 70%": "Quente",
    "Mais de 70%": "Quente",
  },
  need: {
    "Atender mais rápido e aumentar a demanda": "Morno",
    "Aumentar as receitas e lucros": "Quente",
    "Ter mais clareza sobre vendas e lucros": "Frio",
    "Evitar erros e retrabalhos nos pedidos": "Frio",
  },
  waiters: {
    "1": "Frio",
    "2-3": "Morno",
    "4 ou mais": "Quente",
  },
  goal: {
    "Atender mais mesas sem contratar mais garçons": "Quente",
    "Reduzir o custo da equipe sem perder velocidade": "Quente",
    "Aumentar as vendas nos horários de pico": "Morno",
    "Entender quanto o Ordo pode melhorar meus resultados": "Frio",
  },
};

const SCORE_BY_TEMPERATURE: Record<LeadTemperature, number> = {
  Frio: 20,
  Morno: 60,
  Quente: 100,
};

export function calculateDiagnosticScore(
  answers: DiagnosticAnswers,
): DiagnosticAnalysis {
  const breakdown = Object.fromEntries(
    SCORED_FIELDS.map((field) => [
      field,
      TEMPERATURE_BY_ANSWER[field][answers[field] ?? ""] ?? "Frio",
    ]),
  ) as Record<ScoredField, LeadTemperature>;

  const totalScore = SCORED_FIELDS.reduce(
    (total, field) => total + SCORE_BY_TEMPERATURE[breakdown[field]],
    0,
  );
  const adherence = Math.round(totalScore / SCORED_FIELDS.length);
  const hotCount = Object.values(breakdown).filter((value) => value === "Quente").length;
  const warmCount = Object.values(breakdown).filter((value) => value === "Morno").length;
  const lead: `Lead ${LeadTemperature}` =
    hotCount >= 4 || adherence >= 72
      ? "Lead Quente"
      : hotCount >= 2 || warmCount >= 2 || adherence >= 45
        ? "Lead Morno"
        : "Lead Frio";

  return {
    adherence,
    profitPerspective: Math.round(4 + adherence * 0.22),
    lead,
    breakdown,
  };
}
