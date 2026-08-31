# PRD — Ordo (por Otium)
**Versão:** 1.0
**Status:** Draft
**Responsável:** Gabriel Trzaskos
**Data:** 2026-08-10

### 2026-08-31 — Auditoria das páginas do sistema de gestão

- Escopo auditado: shell e navegação de Gestão, hub, menu/editor de prato,
  mesas/QR, equipe, pagamentos, faturamento, financeiro, insights, estoque,
  ingredientes, plano e Ordo IA.
- Skills e referências usadas: `ui-ux-pro-max` para performance/UI de React e
  dashboards; `design-taste-frontend` como referência de consistência visual e
  estados de interação; documentação local do Next.js 16 para App Router,
  Server/Client Components, client cache, loading UI e acessibilidade.
- Validações executadas: `npm run lint` aprovado; `npm test` aprovado com 3
  arquivos e 32 testes; `npm run build` aprovado com TypeScript e 16 páginas
  estáticas geradas. Não foi executado teste de rede contra Supabase nem
  medição de browser com dados reais nesta sessão.

#### Achados de performance

- **P0 — Ordo IA repete leituras amplas.** `getStockAlerts`,
  `getIngredientForecast` e `getDemandForecast` fazem varreduras independentes
  de pedidos/itens/receitas; o uso de ingredientes ainda encadeia consultas de
  receitas, pedidos, linhas e extras. Em bases maiores, `/gestao/ia` tende a
  ser a página mais lenta. Consolidar uma leitura/agregação compartilhada,
  limitar colunas/linhas e considerar agregados SQL.
- **P0 — Relatórios agregam no servidor após trazer linhas brutas.**
  `getRangeMetrics` lê pedidos e itens de todo o intervalo, e a comparação
  customizada executa mais duas métricas em sequência. Financeiro e Insights
  podem chegar a seis leituras pesadas em uma navegação. Priorizar agregação no
  banco, cache curto por estabelecimento/período e execução paralela de `a`/`b`.
- **P1 — QR Codes são calculados em toda renderização de Mesas.**
  `QRCode.toDataURL` roda uma vez por mesa e os data URLs completos são enviados
  ao Client Component. Isso aumenta CPU e payload conforme o salão cresce.
  Gerar sob demanda para a mesa selecionada, usar rota de imagem/endpoint ou
  persistir apenas o token e renderizar no cliente.
- **P1 — CRUDs revalidam sem atualizar explicitamente a árvore local.** Menu,
  mesas, equipe, ingredientes e estoque usam Server Actions, mas a maioria só
  altera o estado otimista ou mostra erro. A consistência após mutações depende
  de nova navegação/refresh. Definir estratégia única: atualização local +
  `router.refresh` controlado, ou revalidação com estado de confirmação.
- **P1 — Falta `loading.tsx` no grupo `/gestao`.** Não há fallback de rota para
  navegações dinâmicas. O usuário vê a tela anterior sem indicação clara durante
  auth/BD; adicionar skeleton contextual para shell, KPIs, tabelas e editor.
- **P2 — Efeitos de ponteiro fazem trabalho por evento.** A sidebar e o hub
  fazem `getBoundingClientRect`/query de elementos e escrevem estilos durante
  `pointermove`; o hub também aplica tilt, shadow e glow em todos os cards.
  Restringir a desktop/coarse pointer, usar `requestAnimationFrame` com último
  evento e evitar `will-change` permanente nos cards.
- **P2 — Todas as páginas são marcadas `force-dynamic`.** A autenticação por
  cookies já torna as rotas privadas dinâmicas; revisar essa declaração junto
  de Cache Components/segmentação para permitir shell estático e dados
  streamados, sem cachear dados privados indevidamente.
- **P2 — Fontes são declaradas no Root Layout globalmente.** Geist, Bricolage,
  Instrument Serif, Manrope, Barlow, Barlow Semi Condensed, Sora e JetBrains
  Mono são carregadas/propagadas para toda a aplicação, embora Gestão use
  Manrope e as demais áreas tenham necessidades diferentes. Isolar fontes por
  layout pode reduzir CSS e requests iniciais.

#### Achados de design, UI e acessibilidade

- **P0 — Contraste de texto secundário provavelmente falha WCAG AA.** O shell
  usa `rgba(0,0,0,.42/.45/.5)` sobre fundos claros em navegação, labels de KPI e
  textos auxiliares; esses tons ficam abaixo de 4.5:1 para texto normal.
  Centralizar tokens de muted e medir todos os pares antes do redesign.
- **P1 — Navegação não escala bem no mobile.** Em até 900 px a sidebar vira uma
  faixa horizontal com dez destinos, rolagem lateral e rodapé concorrendo pelo
  mesmo espaço. Falta uma hierarquia explícita para destinos principais e
  secundários; considerar menu compacto/drawer ou tabs por contexto.
- **P1 — Formulários usam placeholder como rótulo em vários fluxos.** Menu,
  mesas, equipe, ingredientes, editor de prato e comparação têm inputs sem
  `<label>` visível associado. Isso piora leitura, autofill e acessibilidade;
  labels devem ficar acima dos campos e erros abaixo deles.
- **P1 — Tabelas não têm contenção responsiva consistente.** Financeiro,
  comparação e IA renderizam `table` dentro de containers com
  `overflow-hidden`; em telas estreitas podem comprimir conteúdo ou cortar
  colunas. Adicionar wrapper com rolagem horizontal, `caption`/headers e
  alternativa mobile quando necessário.
- **P1 — Sistema visual está inconsistente entre hub e subpáginas.** O hub usa
  CSS inline próprio, raios 20–22 px, sombras e vermelho fixo; subpáginas usam
  tokens Tailwind remapeados e dezenas de combinações de raio/sombra. Definir
  tokens únicos para superfície, raio, espaçamento, estados e densidade.
- **P2 — Hierarquia e densidade podem ser melhoradas.** O hub tem três KPIs,
  nota explicativa separada e uma grade de módulos; páginas de análise repetem
  cards, títulos e sombras. Um layout de dados mais plano, com agrupamento por
  prioridade e menos contêineres, reduziria ruído e altura de rolagem.
- **P2 — Estados de erro, vazio e pendência são incompletos.** Há bons vazios
  pontuais e erros locais, mas falta skeleton de carregamento, `aria-live` para
  confirmação/erro e confirmação antes de exclusões destrutivas em mesas/equipe.
  Padronizar estados para todas as ações.
- **P2 — Ícones SVG são desenhados localmente em vários componentes.** O hub e
  outros módulos repetem paths inline; adotar uma família de ícones consistente
  ou um conjunto interno documentado reduz variação e facilita acessibilidade.

#### Ordem recomendada para a próxima fase

1. Medir navegação real (TTFB, duração das queries, payload RSC, JS hidratado e
   interação) com um estabelecimento pequeno, médio e grande.
2. Corrigir arquitetura de dados de IA e relatórios; incluir índices/consultas
   agregadas e cache seguro por estabelecimento.
3. Adicionar `loading.tsx`, estados `aria-live` e otimização dos QR Codes.
4. Consolidar design tokens e refazer navegação mobile, formulários e tabelas.
5. Reavaliar microinterações somente depois de estabilizar os tempos reais.

- **Veredito da auditoria:** `NEEDS PERFORMANCE + UI REFACTOR`. O sistema está
  compilável e funcional em nível estrutural, mas há gargalos de dados e
  inconsistências de UI suficientes para justificar uma rodada dedicada antes
  de expandir as páginas.
- Nesta sessão foi aplicado o primeiro lote de backend: consultas independentes
  do hub, menu, estoque e ingredientes foram paralelizadas; comparações de
  Financeiro/Insights agora executam em paralelo; a Ordo IA passou a usar um
  snapshot compartilhado para pedidos, itens, receitas, ingredientes e extras;
  e foi criada a migration `0017_management_query_indexes.sql` com índices
  compostos para estabelecimento/data e modificadores de pedido.
- Validações após as alterações: `npm run lint`, `npm test` (32 testes) e
  `npm run build`, todas aprovadas. A migration ainda depende de aplicação no
  projeto Supabase; não foi executada diretamente contra a base nesta sessão.
- Commit e publicação: a documentação da auditoria estava no commit `8eaebe7`;
  este lote de backend será publicado em commit separado após a validação final.

## Histórico de sessões

### 2026-08-30 — Auditoria de design, conversão e UX da landing

- Auditoria executada com as referências de UI/UX, design anti-slop, click-path,
  inteligência de lead, acessibilidade e browser QA instaladas no projeto.
- Fluxo principal verificado: CTA do hero abre o modal, o avanço vazio mostra
  alerta, o carrossel do diagnóstico informa “Passo 1 de 8” e o resultado exibe
  aderência e projeções ao final. Não foi enviado nenhum lead de produção.
- Lighthouse desktop e mobile: acessibilidade 90, boas práticas 100, SEO 100 e
  agentic browsing 100. Falhas encontradas: ausência de landmark `<main>`,
  contraste insuficiente no número do primeiro card do diagnóstico e dots dos
  carrosséis menores que 24 px.
- Browser QA: nenhum erro de console, nenhuma requisição 4xx/5xx observada,
  sem overflow horizontal em viewport de 375 px. Trace: LCP 258 ms, INP 48 ms
  e CLS 0,00. Não houve baseline visual versionado, então comparação pixel a
  pixel ficou inconclusiva.
- Principais recomendações de conversão: reduzir ou adiar os quatro campos de
  identificação, substituir cases inventados por provas verificáveis ou
  marcá-los como simulação, e tornar o diagnóstico acessível pelo primeiro CTA
  com foco no primeiro campo.
- Riscos de UX/lead registrados: a tela mostra sucesso local antes de a entrega
  do e-mail terminar; falhas não oferecem retry; o campo `budget` é enviado no
  e-mail como “Faixa de investimento”, embora pergunte sobre peso da equipe; e
  o menu “Diagnóstico” leva à seção antes de abrir o questionário.
- Veredito: `SHIP WITH FIXES`. Nenhuma alteração de código foi feita nesta
  sessão; as mudanças ficam pendentes para priorização.

### 2026-08-30 — Hub Cases inspirado no card de referência

- Renomeado o item da navegação lateral de “Resultados” para “Cases”, mantendo
  o ID interno `resultados` para preservar as âncoras e o scroll-spy existentes.
- Atualizado o rótulo visual da seção para “Cases”, alinhando o menu e o
  conteúdo da landing page.
- Reforçado o efeito dos cards com `backdrop-filter: blur(15px)` e fallback
  para WebKit, mantendo o vidro translúcido, a imagem de fachada, a elevação,
  a inclinação 3D e a contagem progressiva já implementadas.
- Validações: `git diff --check`, `npm run lint`, `npm test` (32 testes) e
  `npm run build`, todas aprovadas.
- Deploy de produção concluído na Vercel: `dpl_BNbYyvoKjJNR12nGY2qTyRdSKmQe`,
  status `READY`; alias `https://app-pedidos-seven.vercel.app` validado com
  HTTP 200 e os cards publicados com o efeito de vidro.

### 2026-08-30 — Animação de crescimento dos indicadores

- Adicionada interação de contagem progressiva aos números dos cards de
  “Cases”: os valores começam em zero e crescem até o resultado final quando o
  card entra no viewport.
- Mantidos os sinais de variação e o percentual fora da contagem para leitura
  imediata, com valor completo disponível para tecnologias assistivas.
- O efeito respeita `prefers-reduced-motion` e mantém fallback estático para
  navegadores sem suporte à propriedade CSS animada.
- Validações: lint aprovado, 32 testes aprovados, build de produção aprovado e
  `git diff --check` aprovado.
- Deploy de produção concluído na Vercel: `dpl_5dSr1tSnK6dsQYtzWSVJGsGkWqjV`,
  status `READY`; domínio validado com HTTP 200 e animação de contagem presente
  no HTML.

### 2026-08-30 — FAQ compacto e cases com efeito visual

- Reduzido o espaçamento vertical do hub “FAQ” para uma apresentação mais
  compacta, preservando as duas colunas no desktop e a leitura em coluna única
  no mobile.
- Aplicado aos cards de “Cases” o efeito visual inspirado no anexo: vidro
  translúcido, blur, brilho de borda, elevação e inclinação 3D controlada pelo
  ponteiro, com desativação para `prefers-reduced-motion` e dispositivos de
  toque.
- Adicionada imagem editorial de fachada de restaurante em
  `public/images/ordo-case-facade.png` para dar identidade visual aos cases.
- Validações: lint aprovado, 32 testes aprovados, build de produção aprovado e
  `git diff --check` aprovado.
- Deploy de produção concluído na Vercel: `dpl_HcwBc62Etc5bBmgfuVctoUqwEKgX`,
  status `READY`; domínio e imagem de fachada validados com HTTP 200 e cards
  com efeito visual presentes no HTML.

### 2026-08-30 — Ajuste da navegação e dos cases

- Removida da seção “Resultados” a frase de observação sobre cases
  ilustrativos, conforme solicitado.
- Reordenado o menu lateral: “Diagnóstico” passou para a linha 06 e “FAQ” para
  a linha 07, mantendo o diagnóstico apontando para a seção `contato`.
- Validações: lint aprovado, 32 testes aprovados, build de produção aprovado e
  `git diff --check` aprovado.
- Deploy de produção concluído na Vercel: `dpl_5yF2jzGu8wDTdyNeR7aPJLqJcMHT`,
  status `READY`; domínio validado com HTTP 200, “Diagnóstico” está na linha
  06, “FAQ” na linha 07 e a frase removida não aparece no HTML.

### 2026-08-30 — Fluxo visual do Diagnóstico ORDO

- Removido o formulário da seção pública “Diagnóstico Ordo”; o questionário
  continua disponível no modal acionado pelos CTAs “Fazer diagnóstico grátis”.
- Criado um passo a passo visual com três cards: responder às perguntas, receber
  uma avaliação personalizada e alinhar os próximos passos.
- Refinada a copy para explicar que a equipe analisa o cenário e recomenda o
  plano mais adequado aos processos e objetivos do restaurante.
- Validações: lint aprovado, 32 testes aprovados, build de produção aprovado e
  `git diff --check` aprovado.
- Deploy de produção concluído na Vercel: `dpl_Eir66QNBuiTiMhBiRgbY3sYYHcCs`,
  status `READY`; domínio validado com HTTP 200 e os três passos presentes no
  HTML.

### 2026-08-30 — Cases ilustrativos na seção Resultados

- Substituídos os benefícios genéricos do carrossel “Resultados” por cinco
  cases ilustrativos focados em donos de restaurantes.
- Cada card agora apresenta operação, perfil, métrica de impacto, mudança
  aplicada e resultado: equipe mais enxuta, menor custo de salão, mais pedidos
  por hora, menos retrabalho e margem estimada.
- Incluído aviso visível de que os números são simulações comerciais e variam
  conforme a operação, evitando apresentar resultados inventados como prova
  social real.
- Validações: lint aprovado, 32 testes aprovados, build de produção aprovado e
  `git diff --check` aprovado.
- Deploy de produção concluído na Vercel: `dpl_DLJySXehh5k6hFuKtqCHsFJBkVsn`,
  status `READY`; domínio validado com HTTP 200 e cases presentes no HTML.

### 2026-08-30 — Centralização do modal de diagnóstico

- Ajustado o pop-up do questionário para ficar explicitamente centralizado no
  viewport, tanto na horizontal quanto na vertical.
- Mantidos o limite de altura, o scroll interno e a adaptação para telas
  pequenas.
- Validações executadas: `npm run lint`, `npm test` (32 testes), `npm run
  build` e `git diff --check`, todas aprovadas.
- Deploy de produção concluído na Vercel: `dpl_9Hn4hX6ZJGGVuPNqSNQyynbGoej6`,
  status `READY`; domínio validado com HTTP 200.

### 2026-08-30 — Diagnóstico em modal com transição animada

- Os CTAs “Fazer diagnóstico grátis” agora abrem o questionário em um modal
  nativo e acessível, em vez de apenas rolar até o formulário.
- O modal reutiliza o `DiagnosticForm` existente, preservando cálculo de
  aderência, projeções, envio por e-mail e resultado final.
- Adicionada animação de entrada nas perguntas, com respeito a
  `prefers-reduced-motion`, além de fechamento por botão e tecla Esc.
- Como o projeto não possui shadcn/ui, `sonner` ou `Questionnaire`, a
  experiência foi implementada com `dialog` nativo e CSS escopado, sem nova
  dependência.
- Validações: lint aprovado, 32 testes aprovados, build de produção aprovado,
  `git diff --check` aprovado e produção verificada com HTTP 200, modal e fluxo
  de diagnóstico presentes no HTML.
- Deploy de produção concluído com `dpl_5uco44Xkq92gSyJ58prJzPVgXjQo`, status
  `READY`, alias `https://app-pedidos-seven.vercel.app`.

### 2026-08-30 — Carrossel de resultados

- Criada a seção “Resultados” entre o carrossel dos hubs e “Como funciona”,
  destacando ganhos operacionais: mais ritmo, menos retrabalho, mais mesas,
  equipe mais enxuta e mais clareza.
- Implementado carrossel responsivo inspirado no padrão fornecido, com cards,
  setas, indicadores, seleção direta e três cards no desktop, dois em telas
  intermediárias e um no celular.
- Adicionado “Resultados” ao menu lateral e mantido o CTA “Fazer diagnóstico
  grátis” na própria seção.
- Validações: lint aprovado, 32 testes aprovados, build de produção aprovado,
  `git diff --check` aprovado e produção verificada com HTTP 200, seção
  “Resultados” presente e o antigo bloco “0% de comissão” ausente.
- Deploy de produção concluído com `dpl_9KBz3vSZTSk74rxYcDSMMdSBreKU`, status
  `READY`, alias `https://app-pedidos-seven.vercel.app`.

### 2026-08-30 — Carrossel de hubs e redistribuição da conversão

- Removidos da seção “Diferenciais” os seis cards numerados, incluindo o item
  “0% de comissão”, conforme solicitado.
- Criado um carrossel visual entre “Diferenciais” e “Como funciona”, com
  previews dos hubs Gestão, Atendimento, Cozinha e Cliente, setas, indicadores
  de posição, rotação automática e suporte a `prefers-reduced-motion`.
- Os previews foram construídos dentro da landing porque as páginas reais de
  preview usam proteção contra iframe (`frame-ancestors 'none'` e
  `X-Frame-Options: DENY`); nenhuma proteção de segurança foi enfraquecida.
- Distribuídos CTAs “Fazer diagnóstico grátis” no hero, diferenciais,
  carrossel, “Como funciona” e planos.
- Movido o FAQ para depois do formulário, mantendo as dez perguntas em duas
  colunas no desktop e uma coluna no mobile.
- Validações: lint aprovado, 32 testes aprovados, build de produção aprovado e
  `git diff --check` aprovado. Produção verificada com HTTP 200, carrossel e
  CTAs presentes no HTML e o bloco “0% de comissão” removido.
- Deploy de produção concluído com `dpl_AB9as3pxzEybEPGFTqdk49FLzXDx`, status
  `READY`, alias `https://app-pedidos-seven.vercel.app`.

### 2026-08-30 — FAQ compacto em duas colunas

- Reorganizado o FAQ em duas colunas com cinco perguntas em cada coluna para
  reduzir a altura da seção e facilitar a varredura visual.
- Mantido o comportamento expansível das respostas e o layout de uma coluna em
  telas pequenas.
- Reduzido o espaçamento vertical da seção para deixar a página mais compacta.
- Validações: lint aprovado, 32 testes aprovados, build de produção aprovado,
  `git diff --check` aprovado e produção verificada com HTTP 200 e FAQ presente
  no HTML.
- Deploy de produção concluído com `dpl_CdnrNdWFv3hhBJZXpNnTdeDkuEV1`, status
  `READY`, alias `https://app-pedidos-seven.vercel.app`.

### 2026-08-30 — Métricas no hub de diagnóstico

- Transformados os quatro pontos de “O diagnóstico olha para” em mensagens
  numéricas: 7 minutos até o primeiro atendimento, 12 pedidos por hora no
  pico, 36,5% da receita em equipe e 5% de margem antes de impostos.
- Os números de atendimento e capacidade são referências ilustrativas para
  orientar a conversa comercial; a interface informa que a medição real será
  feita com os dados de cada restaurante.
- Os percentuais de equipe e margem foram baseados em referências da National
  Restaurant Association; não são metas nem padrão obrigatório para o Brasil.
- Atualizado o texto de restaurantes médios e pequenos para “fazer mais com
  equipes menores”.
- A referência de 36,5% foi encontrada no levantamento 2025 da National
  Restaurant Association para restaurantes full-service em 2024; a referência
  de 5% é uma margem pré-impostos típica apresentada pela mesma entidade. Os
  números não foram tratados como padrão brasileiro nem como promessa.
- Validações: lint aprovado, 32 testes aprovados, build de produção aprovado e
  `git diff --check` aprovado. Produção verificada com HTTP 200 e textos novos
  presentes no HTML.
- Deploy de produção concluído com `dpl_DhBHNCAeCC3TrPq3iqPBJFwDaifg`, status
  `READY`, alias `https://app-pedidos-seven.vercel.app`.

### 2026-08-30 — FAQ e limpeza do hero

- Removido do topo do hero o selo “Para donos de restaurantes”, deixando a
  mensagem principal mais direta.
- Criada a seção FAQ com dez perguntas e respostas sobre funcionamento,
  equipe, comissão, cardápio, dados de vendas e escolha de plano.
- Adicionado “FAQ” ao menu lateral com scroll-spy e navegação por âncora.
- FAQ implementado com `details/summary`, mantendo respostas fechadas por
  padrão, foco de teclado e boa adaptação para telas pequenas.
- Validações: lint aprovado, 32 testes aprovados, build de produção aprovado,
  `git diff --check` aprovado e produção verificada com HTTP 200, FAQ presente
  e selo removido do HTML.
- Deploy de produção concluído com `dpl_CPFA6w8gcTvzohwjNJfkEAeUttVt`, status
  `READY`, alias `https://app-pedidos-seven.vercel.app`.
- Pendente: revisão visual dos próximos blocos de conteúdo da home.

### 2026-08-30 — Ajuste da mensagem na tabela de impacto

- Atualizada a linha “Pedido” para explicar que o cliente envia o pedido à
  cozinha em tempo real e o garçom fica responsável por levá-lo à mesa.
- Substituída a linha “Contratação” por “Equipe”, reforçando que equipes
  mínimas podem absorver a demanda e que o objetivo é aumentar os lucros.
- Corrigida a redação para “menores os lucros” e “equipes mínimas”, mantendo a
  tabela legível em desktop e com rolagem horizontal em telas pequenas.
- Validações: lint aprovado, 32 testes aprovados, build de produção aprovado,
  `git diff --check` aprovado e produção verificada com HTTP 200 e os textos
  atualizados presentes no HTML.
- Deploy de produção concluído com `dpl_GQ5W3KqQpXDqDxsbvBeegnzM63Xh`, status
  `READY`, alias `https://app-pedidos-seven.vercel.app`.
- Pendente: revisão visual dos próximos blocos de conteúdo da home.

### 2026-08-30 — Organização visual da página inicial

- Centralizado o hero em toda a viewport, incluindo o título principal, a
  mensagem de posicionamento e os CTAs.
- Centralizados os títulos das seções, os blocos de segmentação, os cards de
  diferenciais, os planos e a chamada do diagnóstico para criar uma leitura
  mais clara e visível.
- O formulário continua com labels, campos e opções alinhados à esquerda para
  preservar o padrão de leitura e a acessibilidade de formulários.
- Removido o estado inicial invisível dos elementos com reveal, evitando que
  textos fiquem ocultos enquanto o JavaScript ou o observador de rolagem
  carregam.
- Validações: lint aprovado, 32 testes aprovados, build de produção aprovado
  e `git diff --check` aprovado.
- Deploy de produção concluído com `dpl_DEez2Dvyt2QQoSaeQ3qRNk3XKoXR`, status
  `READY`, alias `https://app-pedidos-seven.vercel.app` e verificação HTTP 200.
- Pendente: revisão visual no link de produção e próximos ajustes de UX.

### 2026-08-30 — Diagnóstico do erro 403 do Resend

- Logs de produção confirmaram que a chamada de envio está chegando ao Resend,
  mas retornando HTTP 403.
- Adicionado `User-Agent` à chamada direta da API e registro controlado do
  corpo do erro nos logs, sem registrar a chave secreta.
- A configuração externa ainda precisa usar um remetente permitido pelo
  Resend: `onboarding@resend.dev` funciona apenas para o e-mail proprietário da
  conta de teste; para outros destinatários é necessário verificar um domínio.
- Correção publicada com `dpl_818jSen2XFHVt4ATT5ijGVwUWqnS`, status `READY`,
  alias `https://app-pedidos-seven.vercel.app`. Logs precisam ser rechecados
  após um novo envio do formulário.

### 2026-08-30 — Exibição do resultado e diagnóstico do envio

- Restaurados no resultado público o percentual de aderência e as projeções do
  primeiro e do segundo mês, conforme solicitado para quem responde o formulário.
- Confirmado no ambiente Production da Vercel que `RESEND_API_KEY` e
  `RESEND_FROM_EMAIL` ainda não estão cadastradas. Por isso, os e-mails não
  chegam ao destinatário, embora o resultado seja calculado localmente.
- Validações: lint aprovado, 32 testes aprovados e build de produção aprovado.
- Aguardando a chave do Resend para concluir o envio real de e-mails.
- Nova publicação concluída com `dpl_GpWiMiWEy9Ubv4zkw5np525q4Wtc`, status
  `READY`, alias `https://app-pedidos-seven.vercel.app` e verificação HTTP 200.

### 2026-08-30 — Resultado desacoplado do envio de e-mail

- Ajustado o envio do diagnóstico para preparar a confirmação imediatamente no
  navegador, sem depender da resposta do Resend para exibir o resultado.
- Mantidos o envio server-side, a classificação e as projeções internas; falhas
  de e-mail agora aparecem como aviso sem bloquear a confirmação ao prospect.
- Validações e deployment serão registrados após a publicação desta alteração.

### 2026-08-30 — Atualização do destinatário do formulário

- Alterado o destinatário dos diagnósticos enviados pelo Resend para
  `otium.sap@gmail.com`.
- Mantidos o assunto personalizado com o nome do restaurante, o e-mail de
  resposta do prospect e a classificação interna da análise.
- Validações: lint aprovado, 32 testes aprovados e build de produção aprovado.
- Deploy concluído com `dpl_Dw4puugMnJZot9MH9ZZJM7dVnEQi`, status `READY`,
  alias `https://app-pedidos-seven.vercel.app`.

### 2026-08-30 — Pontuações ocultas no resultado público

- Removidos da tela final do formulário todos os percentuais de aderência e de
  aumento de lucros.
- Mantidos o cálculo, a classificação e as projeções no fluxo interno de
  prospecção, para uso na apresentação comercial e no e-mail da equipe.
- O prospect agora recebe apenas uma confirmação acolhedora, informando que a
  análise personalizada será apresentada pela equipe ORDO.
- Validações: lint aprovado, 32 testes aprovados, build de produção aprovado e
  `git diff --check` aprovado.
- Deploy de produção concluído com `dpl_4vbk9D2p1FhJwMBatj3svsD69b98`, status
  `READY`, alias `https://app-pedidos-seven.vercel.app`.
- Nova publicação concluída com `dpl_9tNb92iiF3VjMQuRe9hDKMs7SNJ3`, status
  `READY`, alias `https://app-pedidos-seven.vercel.app`.

### 2026-08-30 — Resultado automático de aderência do diagnóstico

- Criada uma análise automática para aparecer ao final do formulário com o
  percentual grande de “aderência para usar o ORDO” e uma perspectiva estimada
  de aumento de lucros.
- Respostas Quentes recebem peso 100, Mornas recebem peso 60 e Frias recebem
  peso 20. A aderência é a média das sete respostas de qualificação.
- A perspectiva exibida em dois horizontes varia de 8% a 26% no primeiro mês e
  de 50% a 162% no segundo mês conforme a aderência. É apresentada como
  projeção inicial baseada nas respostas, não como promessa de resultado.
- O e-mail de prospecção agora inclui classificação geral, percentuais e a
  classificação individual de cada resposta.
- Adicionados testes unitários para os cenários totalmente Quente e totalmente
  Frio. Validações: lint aprovado, 32 testes aprovados, build de produção
  aprovado e `git diff --check` aprovado.
- Deploy de produção concluído com `dpl_6UkpJP8ckmzf6TPYoTkz3Q9LtCAd`, status
  `READY`, alias `https://app-pedidos-seven.vercel.app` e verificação HTTP 200.
- Deploy de produção concluído com `dpl_Cd8tnKU8D1zYUx7pd3f6KG8zmNoX`, status
  `READY`, alias `https://app-pedidos-seven.vercel.app` e verificação HTTP 200.

### 2026-08-30 — Pergunta final orientada a resultado

- Substituída a pergunta final sobre prazo de decisão por: “Qual resultado
  faria mais diferença no lucro do seu restaurante hoje?”.
- Novas opções: atender mais mesas sem contratar mais garçons, reduzir o custo
  da equipe sem perder velocidade, aumentar as vendas nos horários de pico e
  entender quanto o Ordo pode melhorar os resultados.
- Ajustada a última opção da pergunta sobre peso da equipe para exatamente
  “Mais de 70%”.
- A classificação definitiva das respostas da nova pergunta ficou pendente de
  definição comercial com o responsável pelos leads.
- Validações: lint aprovado, 30 testes aprovados, build de produção aprovado e
  `git diff --check` aprovado.

### 2026-08-30 — Identificação agrupada no primeiro slide

- Ajustado o carrossel para reunir nome do restaurante, nome do responsável,
  e-mail e WhatsApp no primeiro slide.
- Mantidas as perguntas de qualificação em slides individuais a partir da
  segunda etapa, com progresso e navegação preservados.
- O primeiro slide usa grade responsiva: duas colunas em telas maiores e uma
  coluna no mobile.
- Validações: lint aprovado, 30 testes aprovados, build de produção aprovado e
  `git diff --check` aprovado.

### 2026-08-30 — UX do diagnóstico em carrossel

- Transformado o formulário de diagnóstico em um carrossel com uma pergunta
  por tela, progresso visível, navegação para voltar e validação antes de
  avançar.
- A primeira sequência passou a coletar identificação, cargo, autoridade de
  decisão, perfil do restaurante, peso da equipe, desafio principal, quantidade
  de garçons e timing de melhoria.
- Atualizadas as opções de desafio conforme a estratégia comercial: velocidade
  e demanda, receitas e lucros, clareza financeira e redução de erros/retrabalho.
- Incluídas as perguntas de cargo, tomada de decisão e garçons de salão.
- O Server Action agora classifica internamente o lead como quente, morno ou em
  qualificação e envia essa classificação junto aos dados para
  `otumia@gmail.com`, mantendo as etiquetas invisíveis para o prospect.
- Validações desta sessão: lint aprovado, 30 testes aprovados, build de
  produção aprovado e `git diff --check` aprovado.
- Deploy de produção concluído com `dpl_687m3foumJzD4XorK7WwzJkXWhEJ`, status
  `READY`, alias `https://app-pedidos-seven.vercel.app` e verificação HTTP 200.
- Pendência: o envio real depende de cadastrar `RESEND_API_KEY` e
  `RESEND_FROM_EMAIL` no ambiente Production da Vercel.

### 2026-08-30 — Desbloqueio do deployment Vercel

- Investigado o bloqueio diretamente na API da Vercel após a captura mostrar
  `Blocked`.
- Causa encontrada: commits estavam usando o autor `seu@email.com`, que não
  tinha acesso à equipe Vercel `gabrieltrzaskosm-7642's projects`.
- Corrigido o e-mail Git local para `gabrieltrzaskosm@gmail.com` e criado o
  commit `2048f4f` para disparar novo deployment.
- Novo deployment `dpl_5bAqfwcTYhjUdSeuryzNr4edhLuU` concluído com sucesso,
  `readyState: READY`, e alias de produção `https://app-pedidos-seven.vercel.app`.
- Verificação HTTP confirmou a landing publicada e as novas mensagens do hero.
- A configuração do Resend (`RESEND_API_KEY` e `RESEND_FROM_EMAIL`) continua
  pendente para ativar o envio do formulário de diagnóstico.

### 2026-08-30 — MCP da Vercel

- Adicionado o servidor MCP global `vercel` ao Codex usando
  `https://mcp.vercel.com`.
- Autenticação OAuth concluída com sucesso.
- Verificação concluída: MCP `vercel` aparece habilitado e autenticado.
- Nenhum arquivo ou código da aplicação foi alterado; por isso não houve novo
  deploy da aplicação.

### 2026-08-30 — Verificação do link de produção

- Verificado o deployment `dpl_AP6VkvARF7x6gvbkonmBKJMzGbC1` e a URL pública.
- A URL responde com HTTP 200, mas ainda exibe a tela da Vercel “Deployment is
  building”; o `vercel inspect` continua retornando `UNKNOWN`.
- Para liberar a landing, é necessário concluir/recriar o deployment no Vercel
  e confirmar o projeto/branch/build correto.
- O envio do diagnóstico também depende de cadastrar no ambiente Production as
  variáveis `RESEND_API_KEY` e `RESEND_FROM_EMAIL`, e então fazer novo deploy.
- Captura do painel confirmou `Blocked` nos quatro deployments recentes. A
  inspeção técnica mostrou `readyState: BLOCKED` no deployment e
  `readyState: READY` no build interno, indicando bloqueio de promoção/liberação
  na Vercel, não falha de compilação do código.
- Nova tentativa manual de deploy criou `dpl_BonWemHVvLqdwj7xJySTvXCvm1ba`,
  novamente com build `READY` e deployment `BLOCKED`. A tentativa de promoção
  manual foi recusada pela Vercel com HTTP 422 porque o deployment não estava
  pronto para promoção. Bloqueio externo permanece.

### 2026-08-30 — Landing orientada a lucro e diagnóstico BANT

- Reposicionada a landing para falar diretamente com o dono do restaurante:
  “Seu restaurante trabalhando com menos equipe e você lucrando mais”.
- Removido o fundo animado/spotlight do hero e adotado fundo fixo, com foco na
  promessa principal e CTA “Fazer diagnóstico grátis”.
- Posicionamento incluído na primeira dobra: “O único sistema que diminui o
  trabalho e aumenta a demanda”.
- Criados blocos específicos para restaurantes grandes/alta demanda e
  médios/pequenos com pressão de equipe, além de indicadores e tabela de
  impacto operacional. Os indicadores são pontos de diagnóstico, não métricas
  históricas inventadas apresentadas como prova.
- Corrigidas promessas de pagamento online na landing: o produto atual informa
  pagamento manual na mesa.
- Criado formulário de diagnóstico com qualificação BANT (perfil, autoridade,
  pressão de equipe/orçamento, necessidade e timing), validação server-side e
  proteção honeypot.
- Criado Server Action com envio para `otumia@gmail.com` via API do Resend e
  assunto `Formulário do Sistema ORDO - [NOME DO RESTAURANTE]`.
- Bloqueio de configuração: o projeto Vercel não possui ainda
  `RESEND_API_KEY`/`RESEND_FROM_EMAIL`; sem essas variáveis o formulário não
  envia e-mails em produção. Nenhum segredo foi incluído no repositório.
- Validações: lint aprovado, 30 testes aprovados, build de produção aprovado e
  `git diff --check` aprovado.
- Deploy enviado ao Vercel (`dpl_AP6VkvARF7x6gvbkonmBKJMzGbC1`), mas a
  confirmação externa retornou status `UNKNOWN`; publicação ainda não deve ser
  considerada confirmada. URL gerada:
  `https://app-pedidos-r7e5hop3s-gabrieltrzaskosm-7642s-projects.vercel.app`.

### 2026-08-30 — Redirecionamento da landing para conversão do dono

- Removido o fundo animado/spotlight do hero; a primeira dobra agora usa fundo
  fixo e foco tipográfico na promessa: “Seu restaurante trabalhando com menos
  equipe e você lucrando mais”.
- Posicionamento atualizado para: “O único sistema que diminui o trabalho e
  aumenta a demanda”, falando diretamente com o dono e conectando velocidade,
  equipe e lucro.
- Criada segmentação para restaurantes grandes com alta demanda e restaurantes
  médios/pequenos com pressão de folha/equipe.
- Corrigidas promessas incompatíveis com o produto atual: pagamento online foi
  removido da copy da landing e substituído por pagamento manual na mesa.
- Criados indicadores de diagnóstico (tempo até o pedido, pedidos por hora,
  equipe sobre faturamento e tempo de fechamento) e tabela “Hoje / Com Ordo /
  O que muda”, sem apresentar resultados fictícios como dados comprovados.
- Criado formulário de diagnóstico com qualificação BANT: perfil, autoridade,
  pressão de equipe/orçamento, necessidade e prazo. O formulário valida no
  servidor, inclui honeypot e foi preparado para enviar para `otumia@gmail.com`
  com assunto `Formulário do Sistema ORDO - [NOME DO RESTAURANTE]` via Resend.
- Configuração pendente no Vercel: `RESEND_API_KEY` e `RESEND_FROM_EMAIL` ainda
  não existem no projeto; sem elas o formulário não pode enviar e-mails em
  produção. Nenhum segredo foi adicionado ao repositório.
- Validações: lint aprovado, 30 testes aprovados, build de produção aprovado e
  `git diff --check` aprovado.

### 2026-08-30 — Primeira rodada de UX no fluxo da mesa

- Ajustada a promessa da tela do cliente: agora informa que o pedido é feito
  pelo celular e o pagamento acontece na mesa, com o atendente.
- Reorganizado o acesso a ajuda em um bloco secundário “Precisa de ajuda?” com
  ação curta “Chamar”, mantendo o cardápio como foco principal.
- Atualizados textos para pt-BR (“Seu nome”) e adicionada semântica
  `role="status"`/`aria-live` às mensagens de retorno do fluxo.
- Corrigido o limiar do scroll-spy das categorias, que estava maior que a
  altura aproximada do cabeçalho fixo no celular.
- Validações: lint aprovado e 30 testes aprovados. Build de produção em
  execução nesta sessão.
- Deploy de produção enviado ao Vercel, que forneceu a URL de deployment, mas
  a confirmação final ficou bloqueada: `vercel inspect` retornou status
  `UNKNOWN` e o acompanhamento não avançou. Não declarar produção como
  confirmada até nova verificação no painel/CLI.
- Pendência: revisão visual em dispositivo real/viewport de 375px e avaliação
  de outras superfícies (Gestão, Cozinha e landing pública).

### 2026-08-29 — Instalação da skill Design Taste Frontend

- Instalada a skill `design-taste-frontend` do repositório
  `Leonxlnx/taste-skill` em `.agents/skills/`.
- A skill orienta design de landing pages e redesigns, com foco em direção
  visual, acessibilidade, responsividade, estados de interface e prevenção de
  layouts genéricos.
- A instalação não alterou o código da aplicação.

### 2026-08-29 — Instalação do plugin ECC

- Marketplace `ecc` adicionado a partir de `affaan-m/ECC`.
- Plugin `ecc@ecc` instalado e habilitado no Codex, versão 2.2.0.
- Verificação do cache concluída com sucesso; todas as referências do manifesto
  (`skills`, MCP, ícone e logo) foram resolvidas.
- Nenhum arquivo de aplicação foi alterado nesta sessão.

### 2026-08-29 — Instalação do UI/UX Pro Max

- O CLI `uipro` já existente no ambiente (`uipro-cli@2.2.3`) foi utilizado para
  inicializar o projeto para o Codex.
- Foi criado `.codex/skills/ui-ux-pro-max/`, com instruções, dados de design e
  scripts para apoiar futuras alterações de UI/UX.
- A instalação global do pacote alternativo `ui-ux-pro-max-cli` não foi feita
  porque o executável `uipro` já existia; não foi sobrescrito à força.

### 2026-08-29 — Alinhamento ao Brasil e LGPD

- Alinhado o produto ao mercado brasileiro: BRL, pt-BR, Pix no modelo de dados
  e pagamento manual na mesa no estado atual.
- Criada a migration `0016_brazil_defaults.sql` e atualizado o seed para BRL.
- Removidas referências operacionais a Portugal, Stripe e fornecedores fiscais
  europeus da documentação e configuração de ambiente.
- Atualizados os Termos de Uso e a Política de Privacidade com controlador,
  operadora, bases legais, direitos dos titulares, retenção, transferências
  internacionais, encarregado e incidentes conforme LGPD/ANPD.
- Corrigidos problemas de lint em `ClienteMenu.tsx` e atualizados textos da UI.
- Validações concluídas: 30 testes aprovados, lint aprovado, TypeScript aprovado
  e build de produção aprovado.
- Pendências: revisão jurídica final; validar conversão de estabelecimentos
  existentes em EUR; definir residência de dados, gateway online e fluxos
  completos de direitos LGPD.

### 2026-08-29 — Protocolo de entrega

- Decidido que sessões com alterações devem terminar, após validação, com commit
  e push para o GitHub e deploy de produção na Vercel.
- Segredos, `.env.local` e credenciais nunca devem ser incluídos no commit.
- Falhas de acesso a serviços externos devem ser registradas como bloqueio no
  resumo da sessão.

> **Legenda de marcações**
> 🟡 **[A CONFIRMAR]** — inferido do código; validar.
> 🔴 **[DECISÃO TUA]** — decisão de negócio/estratégia; código não responde.
> 🟢 **[JÁ EXISTE]** vs 🔵 **[ROADMAP]** — o que está implementado vs proposto.

---

# 1. Resumo do Produto

## 1.1 Nome do produto
**Ordo** — plataforma de pedido, operação e gestão para restauração, da **Otium**.

## 1.2 Descrição

Ordo é um SaaS para restaurantes que digitaliza o ciclo completo de uma mesa: o **cliente lê um QR code**, vê o cardápio, monta o pedido e chama o atendente pelo celular — sem instalar app e sem login. O pedido cai **em tempo real** em dois painéis operacionais: a **Cozinha (KDS)**, onde a equipe avança cada prato pelos estados (na fila → em preparo → pronto → entregue), e o **Atendimento**, que recebe chamadas de mesa, é avisado quando um prato fica pronto para levar e fecha a conta.

Para o dono, há a **Gestão**: cardápio (categorias, itens, opções/extras, esgotados), mesas e QR codes, equipe e permissões, e — conforme o plano — balanço financeiro, insights de negócio, estoque com baixa automática e um **resumo inteligente do dia por IA**.

O problema que resolve: em muitos restaurantes o pedido ainda passa por papel, memória e idas e vindas à mesa, gerando erros, atrasos, filas para pagar e zero dados sobre o que está a acontecer. Ordo transforma isso num fluxo digital, em tempo real e multi-utilizador, sem hardware dedicado (corre em qualquer telemóvel/tablet/ecrã) e sem comissão por pedido.

Proposta de valor principal: **tirar o pedido do papel e pôr a operação e os números em tempo real, no telemóvel, sem hardware nem comissão.**

### Resumo em uma frase
> Ordo ajuda restaurantes a receber e operar pedidos à mesa por QR code, em tempo real, dando à cozinha, ao garçom e ao dono um só sistema — sem app para o cliente e sem comissão por pedido.

✅ **Mercado primário: Brasil (decidido).** Moeda **BRL (R$)**; pagamento atual manual na mesa; Pix, cartão e Apple Pay ficam no roadmap; copy **pt-BR**; conformidade **LGPD**; **sem faturamento** nesta fase. O banco usa BRL como default e mantém valores antigos do enum de pagamento apenas por compatibilidade histórica.

---

# 2. Contexto e Problema

## 2.1 Problema atual
Hoje, um restaurante de serviço à mesa precisa de anotar pedidos, levá-los à cozinha e coordenar entrega e pagamento, mas enfrenta:
* **Pedido manual/papel:** anotação à mão, erros de transcrição, pratos trocados, extras esquecidos.
* **Coordenação lenta cozinha↔salão:** ninguém sabe em tempo real o que está na fila, em preparo ou pronto; pratos prontos esfriam à espera de serem levados.
* **Fricção no pagamento e nas chamadas:** cliente sem forma fácil de chamar o garçom ou fechar a conta; filas e esperas.
* **Zero dados:** o dono não sabe o faturamento do dia, ticket médio, horários de pico, mais vendidos ou ruptura de estoque sem contar à mão.
* **Custo/atrito de tecnologia:** POS tradicionais são caros, exigem hardware e muitas vezes cobram comissão por pedido.

## 2.2 Impacto do problema
* Erros humanos no pedido → retrabalho, desperdício, reclamações.
* Tempo perdido em idas à mesa e à cozinha → menos mesas atendidas.
* Pratos prontos parados → pior experiência e comida fria.
* Decisões “no achismo” por falta de dados → compras e escalas mal dimensionadas.
* Perda de margem com comissões e hardware.

## 2.3 Solução proposta
Ordo resolve permitindo que:
1. O **cliente** peça e chame o garçom por QR, sem app nem login (preços sempre recalculados no servidor).
2. A **cozinha** veja e mova os pedidos em tempo real (KDS), com alerta de pedido novo e tempos por estado.
3. O **garçom** receba chamadas e o aviso de “prato pronto para entregar” (som + balão persistente até marcar entregue) e cobre a conta.
4. O **dono** configure cardápio/mesas/equipa e — por plano — veja financeiro, insights, stock e um **resumo do dia por IA**, tudo multi-tenant e isolado por estabelecimento.

---

# 3. Objetivos do Produto

## 3.1 Objetivo principal
Ser o sistema operacional único do restaurante à mesa: **do pedido do cliente ao fecho da conta e à leitura dos números**, em tempo real, sem hardware dedicado e sem comissão por pedido.

## 3.2 Objetivos secundários
* Reduzir erros e tempo por pedido (menos idas à mesa/cozinha).
* Encurtar o tempo entre “prato pronto” e “prato na mesa”.
* Dar ao dono visibilidade diária/mensal (faturamento, ticket, mais vendidos, estoque).
* Monetizar por planos (Basic/Pro/Max) com upsell natural (dados + IA + stock).
* Manter conformidade de dados (RLS multi-tenant e LGPD).

## 3.3 Não objetivos (nesta versão)
* **Pagamento online in-app** (Pix/cartão/Apple Pay pelo cliente) — **fora do produto atual**; hoje o pagamento é **manual/na mesa**. 🔵 Roadmap.
* **Faturamento** — **sem faturamento nesta fase (decidido)**; fornecedores fiscais ficam fora do MVP. 🔵 **NF-e/NFC-e (BR)** como possível V2.
* **Billing automático de assinatura** — o plano é definido à mão pelo operador (`establishments.plan`); não há cobrança automática.
* **App nativa** (iOS/Android) para cliente ou staff — é web/PWA-like.
* **Delivery/takeaway, reservas, fidelidade, multi-idioma** — fora deste ciclo.
* **Integração com POS/ERP externos, KDS de hardware, impressoras fiscais.**

---

# 4. Métricas de Sucesso

| Métrica | Meta |
| --- | --- |
| Restaurantes ativos (com ≥1 pedido/semana) | 100 restaurantes ativos até 31/12 |
| Conversão trial → pago | 65% |
| Retenção mensal de restaurantes (logo churn) | Será cobrado valor de instalação + Mensalidade |
| Tempo p/ tarefa principal (cliente: QR → pedido enviado) | alvo < 120 s |
| Tempo “pronto → entregue” | alvo < 10 min |
| Taxa de erro de pedido (cancelamentos/correções) | 1/100 pedidos |
| Disponibilidade (uptime) | alvo 99,9% (assente em Supabase + Vercel) |

## North Star Metric
Aumentar o lucro e faturamento dos resturantes.

---

# 5. Público-Alvo

## 5.1 Persona principal — Dono/Gerente do restaurante
**Nome fictício:** Marina, dona de bistrô/trattoria de 8–20 mesas.
**Perfil:** gere pessoas, compras e caixa; usa telemóvel o dia todo; não é técnica.
**Objetivo:** vender e lucrar mais com equipe menor; saber os números do dia.
**Problemas:** pedido no papel dá erro; não sabe a faturação sem fechar o caixa à mão; não sabe o que mais vende nem quando é o pico; hardware/POS é caro, gasta muito com equipe, menor lucro no final do mês
**Nível técnico:** baixo–médio.

## 5.2 Personas secundárias
* **Garçom/Atendente** (nível técnico baixo): quer atender chamadas, saber o que está pronto para levar e cobrar rápido — tudo no telemóvel.
* **Cozinheiro** (nível técnico baixo): quer ver os pedidos a chegar e movê-los sem falar com ninguém; ecrã/tablet fixo na cozinha (KDS).
* **Cliente final** (nível técnico variado, anónimo): quer aproveitar seu momento no restaurante sem ser interrompido e viver a experiencia de forma agradável para ele.

---

# 6. Perfis e Permissões

Papéis do sistema (enum `staff_role`): **owner, manager, kitchen, waiter** + **cliente anónimo** (sem conta, via `qr_token`).

## Owner (dono) — inclui tudo do manager
* Criar/gerir o estabelecimento; gerir equipa e papéis; definir plano (na prática hoje via operador).
* Cardápio, mesas/QR, stock; financeiro, insights, IA (por plano).

## Manager (gerente)
* Igual ao owner no operacional e de gestão (RLS trata owner e manager como “manager” para escrita de config).
* distinção fina owner↔manager (ex.: só owner apaga o estabelecimento / mexe em billing).

## Kitchen (cozinha) / Waiter (atendimento)
* Operar pedidos: avançar estados, cancelar, criar pedido pelo balcão (waiter), resolver chamadas de garçom, **marcar pago** (cobrança manual).
* **Não** editam cardápio, mesas, equipa nem veem financeiro/insights.

## Cliente anónimo (sem login)
* Ver cardápio da mesa, criar pedido e chamar garçom — via `qr_token`. Sem políticas RLS próprias (default deny); tudo passa por servidor com service role que valida o token e restringe à mesa/estabelecimento.

### Matriz de permissões
| Recurso | Owner | Manager | Kitchen | Waiter | Cliente |
| --- | :--: | :--: | :--: | :--: | :--: |
| Ver cardápio | ✅ | ✅ | ✅ | ✅ | ✅ (da sua mesa) |
| Editar cardápio/mesas | ✅ | ✅ | ❌ | ❌ | ❌ |
| Criar pedido | ✅ | ✅ | ✅ | ✅ | ✅ (da sua mesa) |
| Avançar/cancelar pedido | ✅ | ✅ | ✅ | ✅ | ❌ |
| Marcar pago / fechar conta | ✅ | ✅ | ✅¹ | ✅¹ | ❌ |
| Resolver chamada de garçom | ✅ | ✅ | ✅ | ✅ | ❌ |
| Financeiro / Insights | ✅ (plano Pro+) | ✅ (Pro+) | ❌ | ❌ | ❌ |
| Stock / IA | ✅ (plano Max) | ✅ (Max) | ❌ | ❌ | ❌ |
| Equipa / permissões | ✅ | ✅ | ❌ | ❌ | ❌ |
| Definir plano | ✅ | ✅  | ❌ | ❌ | ❌ |

¹ `markPaid` corre no servidor com admin client (RLS de `payments` é owner/manager) confirmando sempre o estabelecimento da sessão.

---

# 7. Jornada Principal do Usuário

**Jornada do dono (onboarding → operação):**
1. Dono acede a `/signup` e cria conta + estabelecimento (torna-se **owner**, já confirmado via service role).
2. É redirecionado para a **Gestão**.
3. Configura o **cardápio** (categorias, itens, extras) e as **mesas**; imprime os **QR codes**.
4. Cria contas para **cozinha/atendimento** em Gestão → Equipa.
5. Operação diária corre nos painéis Cozinha e Atendimento.
6. (Plano) Consulta financeiro/insights e o resumo do dia por IA.

**Jornada do cliente (o core do valor):**
1. Lê o **QR da mesa** → abre `/mesa/[token]` (sem login).
2. Vê o cardápio (esgotados escondidos/desativados em tempo real), monta o pedido com extras/quantidades.
3. Envia o pedido → cai na **Cozinha** e no **Atendimento** em tempo real.
4. Pode **chamar o garçom**.
5. Acompanha o estado do pedido no próprio ecrã.
6. **Paga na mesa** (manual, pelo garçom); a mesa fecha quando tudo entregue e pago.

---

# 8. Fluxos Secundários

## 8.1 Cadastro (`/signup`)
Cria conta (Supabase Auth) + estabelecimento; utilizador vira **owner**; conta criada já confirmada (via service role, sem verificação de email nesta fase — 🟡 ativar antes de produção séria).

## 8.2 Login (`/login`)
Email + senha (Supabase `signInWithPassword`). Sucesso → `/cozinha`. Erro genérico (“Credenciais inválidas.”). Avisos por querystring: `sem-acesso`, `link-invalido`, `link-expirado`.

## 8.3 Recuperação de senha (`/recuperar` → email → `/nova-senha`)
Pedido de reset por email (Supabase); link define nova senha. Links inválidos/expirados caem em `/login?erro=...`.

## 8.4 Onboarding
Após signup: configurar menu + mesas (imprimir QR) + criar equipa. é livre pela Gestão.

## 8.5 Fluxo principal do produto
Ver §7 (cliente pede/pagamento → cozinha/atendimento em tempo real → entrega/pagamento).

## 8.6 Configurações (Gestão)
Cardápio, mesas, equipe, (estoque), plano e faturamento — restrito a owner/manager.

## 8.7 Logout
`signOut` (Supabase) → `/login`.

---

# 9. Requisitos Funcionais

> Convenção: RF-0xx. Estado 🟢/🔵 indica implementado/roadmap.

## RF-001 — Cadastro de restaurante (owner) 🟢
Criar conta + estabelecimento em `/signup`.
**Regras:** email único (Supabase Auth); senha conforme política do Supabase; email inválido rejeitado; `establishment.slug` único.
**Aceite:** **Dado** um visitante em `/signup`, **quando** submete dados válidos, **então** cria-se a conta (owner) + estabelecimento e entra na Gestão.

## RF-002 — Autenticação 🟢
Login por email+senha.
**Aceite:** credenciais válidas → sessão + `/cozinha`; senha inválida ou utilizador inexistente → **erro genérico** (não revela existência); sessão persiste segundo política do Supabase.

## RF-003 — Recuperar senha 🟢
Reset por email; nova senha em `/nova-senha`. Link inválido/expirado → aviso.

## RF-004 — Gestão de cardápio 🟢
CRUD de categorias, itens (nome, descrição, preço em centavos, imagem, disponível, ordenação, VAT) e **grupos de opções/modificadores** reutilizáveis (`min_select`/`max_select`, extras com `price_delta_cents`).
**Regras:** preço ≥ 0; escrita só manager; grupos podem ser partilhados entre itens (`item_modifier_groups`). **Aceite:** manager cria/edita/remove itens e vê-os no cliente/cozinha.

## RF-005 — Mesas e QR 🟢
CRUD de mesas; cada mesa tem `qr_token` único (gerado); gerar/imprimir QR (dep `qrcode`).
**Aceite:** ao criar mesa, gera-se token+QR; abrir `/mesa/[token]` mostra o cardápio daquele estabelecimento.

## RF-006 — Pedido do cliente (QR) 🟢
Sem login. Monta carrinho com extras/quantidades/notas; envia.
**Regras:** **preços recalculados no servidor** a partir da BD (nunca confia no cliente); valida `qr_token`; **rate limit** por mesa (15 pedidos/60 s); reserva de stock quando aplicável.
**Aceite:** pedido válido cria `orders` (status `placed`) + `order_items` (+ `order_item_modifiers`), com snapshots de nome/preço, e aparece em tempo real na cozinha/atendimento.

## RF-007 — Pedido pelo balcão (staff) 🟢
`createStaffOrder`: garçom escolhe a mesa e monta o pedido (mesmo núcleo `lib/orders/create`, sem `qr_token`, com auth).

## RF-008 — KDS / Cozinha em tempo real 🟢
Board por estado (`placed → in_prep → ready → served`), realtime via Supabase; avançar/cancelar; **alerta de pedido novo por pagar** (som + banner, opt-in); tempos ao vivo por estado com “ATRASADO” (limites: fila 10 min, preparo 30 min, pronto 5 min); faixa de “entregues por pagar”.
**Aceite:** mudança de estado propaga a todos os ecrãs sem refresh manual.

## RF-009 — Atendimento (garçom) 🟢
Abas **Pedidos / Chamadas / Contas**; criar pedido; **notificação de prato pronto** (som + badge + **balão persistente** que só sai ao marcar “Entregue”); cobrar (marcar pago).
**Aceite:** ao ficar `ready`, dispara aviso; “Entregue” avança `ready→served`; qualquer garçom que marque entregue remove o aviso para todos (realtime).

## RF-010 — Chamar garçom 🟢
Cliente cria `waiter_calls` (status `open`); staff resolve (`resolveWaiterCall`).

## RF-011 — Pagamento (manual) 🟢
`markPaid`: marca `orders.paid_at`, insere `payments` (provider `manual`, method `cash`); ao ficar entregue+pago, a mesa fecha (`closed_at`) via `maybeCloseTable`.
🔵 **[ROADMAP]** Pagamento online pelo cliente (Pix/cartão/Apple Pay) + webhooks + idempotência (o esqueleto de `payments`/`webhook_events`/idempotency já existe na BD).

## RF-012 — Esgotados / Stock 🟢(esgotado manual) / 🟢(stock plano Max)
Marcar item “esgotado” (`available=false`); no plano **Max**, stock por artigo e por **ingrediente** com baixa/reserva automática (`reserve_stock`/`release_stock`/`decrement_stock`); disponibilidade efetiva = `available AND (not track_stock OR stock_qty>0)`.

## RF-013 — Financeiro (plano Pro+) 🟢
Balanço diário/mensal: pedidos, faturado, gorjetas, por cobrar, ticket médio (`lib/reports`).

## RF-014 — Insights (plano Pro+) 🟢
Horas de pico, tendências, mais vendidos, comparação semana-a-semana; média de movimento por dia da semana.

## RF-015 — IA: resumo do dia (plano Max) 🟢
`generateDailySummary` — Claude (**claude-haiku-4-5**) resume 3–5 frases sobre dados **agregados** (sem PII), chave da plataforma. + destaque automático do mais pedido, previsão de procura e **alerta preditivo de stock** (`lib/predictions`).

## RF-016 — Equipa e permissões (plano/owner) 🟢
Owner/manager criam contas de staff (kitchen/waiter/manager) e definem papel (`gestao/equipa`).

## RF-017 — Planos e gating 🟢
`establishments.plan` (basic/pro/max) controla acesso a features (`requirePlan`), no servidor e na UI; bloqueio redireciona para `/gestao/plano`.

---

# 10. Regras de Negócio

* **RN-001 — Isolamento multi-tenant:** todo recurso pertence a um `establishment_id`; um utilizador **nunca** acede a dados de outro estabelecimento, mesmo manipulando URL/chamadas — imposto por **RLS** (`private.auth_establishment_id()`), não só na UI.
* **RN-002 — Preço é do servidor:** o valor do pedido é sempre recalculado na BD (item + extras); o cliente nunca dita preço.
* **RN-003 — Cliente anónimo é default-deny:** sem políticas RLS para `anon`; acesso do cliente só via servidor (service role) validando `qr_token` e restringindo à mesa/estabelecimento.
* **RN-004 — Snapshots imutáveis:** `order_items.name_snapshot`/`unit_price_cents` e `order_item_modifiers.name_snapshot`/`price_delta_cents` fixam nome/preço no momento do pedido (mudar o menu depois não altera pedidos passados).
* **RN-005 — Ciclo de vida do pedido:** `placed → in_prep → ready → served` (+ `cancelled`); ativo na mesa enquanto `closed_at IS NULL` e `status != cancelled`.
* **RN-006 — Fecho de mesa:** a mesa zera quando todos os pedidos ativos estão `served` **e** pagos (`paid_at`), preenchendo `closed_at`.
* **RN-007 — Disponibilidade efetiva:** `available AND (not track_stock OR stock_qty>0)`; a zero fica “esgotado” automaticamente.
* **RN-008 — Gating por plano no servidor:** features Pro/Max bloqueadas por `requirePlan` no servidor, não só escondidas na UI.
* **RN-009 — Escrita de config é de manager:** cardápio/mesas/equipe/faturamento só owner/manager (`private.auth_is_manager()`).
* **RN-010 — Rate limit anti-abuso:** pedidos por mesa limitados (15/60 s).
* **RN-011 — Dinheiro em centavos (inteiro):** sem floats; moeda por estabelecimento (`currency`, default BRL).
* **RN-012 — Idempotência de pagamentos:** `payments.idempotency_key` único + `webhook_events (provider,event_id)` único (para o pagamento online futuro).

---

# 11. Estados e Casos de Borda

Por funcionalidade, tratar: **Loading** (transições/`useTransition`, “Enviando…”), **Empty** (“Sem pedidos”, “Nenhuma mesa a chamar”, “Nada pendente”), **Success** (toast/estado, ex. “Pedido enviado”), **Error** (mensagens compreensíveis, erro genérico no login), **Offline/timeout** 🟡 (o realtime mostra “a ligar…/ao vivo”; definir comportamento de reconexão e de submit sem rede — hoje depende do Supabase/Next), **Permissão insuficiente** (redirects `sem-acesso`/`sem-permissao`/gating de plano), **Dados inválidos** (validação **Zod** no servidor + `required`/tipos no cliente).
cobertura consistente de offline/timeout e de conflitos de concorrência (dois garçons a marcar o mesmo pedido).

---

# 12. Páginas e Telas

## Públicas
* `/` — Landing (OrdoLanding: hero, secções `#diferenciais`, `#como`, `#planos`, `#contato`).
* `/login` — Login (redesign escuro/editorial, WebGL).
* `/signup`, `/signup/confirmar` — Cadastro.
* `/recuperar` — “forgot password”; `/nova-senha` — definir nova senha.
* `/termos`, `/privacidade` — documentos legais e LGPD.
* `/mesa/[token]` — **Cardápio do cliente (QR)**.
* Previews públicos (demo, sem auth): `/preview-cozinha`, `/preview-atendimento`, `/preview-gestao`, `/preview-cliente`.

## Área autenticada (staff)
* `/cozinha` — **KDS** (destino pós-login).
* `/atendimento` — **Garçom**.
* `/conta` — conta do utilizador.
* `/gestao` — **Hub** (métricas do dia + movimento por dia da semana).
* `/gestao/menu`, `/gestao/menu/[itemId]` — cardápio.
* `/gestao/mesas` — mesas/QR.
* `/gestao/equipa` — equipa.
* `/gestao/financeiro` (+ `/export`), `/gestao/insights` — dados (Pro+).
* `/gestao/stock`, `/gestao/ingredientes` — stock (Max).
* `/gestao/ia` — resumo/IA (Max).
* `/gestao/plano`, `/gestao/faturacao`, `/gestao/pagamentos` — plano/faturação.

estado de `/gestao/faturacao` e `/gestao/pagamentos` após remoção de Stripe/Vendus (podem estar em skeleton/desativados).

---

# 13. Navegação

```text
Ordo
├── Público
│   ├── / (landing)
│   ├── /login · /signup · /recuperar · /nova-senha
│   └── /mesa/[token] (cliente QR)
├── Staff (auth)
│   ├── /atendimento (garçom)
│   ├── /cozinha (KDS)
│   └── /gestao (owner/manager)
│       ├── Hub
│       ├── Cardápio (menu, item, mesas)
│       ├── Equipa
│       ├── Financeiro · Insights           (Pro+)
│       ├── Stock · Ingredientes · IA        (Max)
│       └── Plano · Faturação · Pagamentos
└── /conta
```
Chrome: `StaffShell` (header + nav) para cozinha/atendimento (acento azul); `GestaoShell` (sidebar própria) para gestão (acento vermelho); login/cliente têm chrome próprio.

---

# 14. Design e UX

## Diretrizes
Interface simples, responsiva, consistente, acessível, orientada à tarefa, usável em telemóvel/tablet/desktop. Cada área tem uma estética própria escopada: **Gestão** (Ordo claro/terracota), **Cozinha KDS** (ecrã de parede, Barlow condensado, slate), **Atendimento** (mobile, tokens Ordo azul), **Cliente** (mobile), **Login** (escuro/editorial, Sora + JetBrains Mono, fundo WebGL).

## Componentes básicos
Tailwind v4 com **tokens em `@theme`** (canvas/surface/ink/muted/line/brand/success/warn, radii, shadows, `tnum`, easing). Padrões reutilizados: botões, inputs, selects, bottom-sheets/modais, cards, toasts, badges, empty/loading/error states, steppers de quantidade.

## Responsividade
* **Mobile:** cliente, atendimento e login são mobile-first.
* **Tablet/ecrã de parede:** cozinha (KDS) reflui (tiles empilham).
* **Desktop:** gestão (sidebar) e login (painel à direita).
🟡 [A CONFIRMAR] breakpoints tablet específicos por tela.

---

# 15. Acessibilidade
Meta: **WCAG 2.1 AA**. Já presente: HTML semântico, `label`/`htmlFor`, `aria-*` em alertas/diálogos, foco visível, `prefers-reduced-motion` respeitado (animações KDS/login congelam), estados não só por cor (badges com texto). 🟡 [A CONFIRMAR] auditoria formal de contraste (sobretudo o KDS/login escuro) e navegação completa por teclado nos fluxos operacionais.

---

# 16. Arquitetura Técnica

## 16.1 Stack
* **Frontend/Full-stack:** **Next.js** (App Router, versão custom do projeto — ver `node_modules/next/dist/docs/`), **React**, **TypeScript** estrito. Sem REST próprio: **Server Actions** + Server Components.
* **UI:** **Tailwind CSS v4** (tokens `@theme`); fontes self-hosted via `next/font` (Geist, Bricolage, Barlow, Sora, JetBrains Mono); WebGL via **ogl** (fundo do login).
* **Backend:** **Supabase** — Postgres + **Auth** + **RLS** + **Realtime**; Server Actions (Next) para mutações; `service role` só no servidor.
* **Banco:** **PostgreSQL** (Supabase), migrations em `supabase/migrations/`.
* **Autenticação:** Supabase Auth (email+senha).
* **Storage:** 🟡 [A CONFIRMAR] `image_url` de itens (Supabase Storage ou URL externa?).
* **Rate limiting:** **Upstash Redis** (`@upstash/redis`).
* **IA:** **Claude** via `@anthropic-ai/sdk` (modelo `claude-haiku-4-5`), chave da plataforma.
* **Deploy:** **Vercel** (projeto `app-pedidos`; deploy por Vercel CLI hoje; região Supabase eu-west-3/Paris).
* **Analytics:** 🔴 [DECISÃO TUA] — não há ferramenta dedicada identificada (ver §26).
* **Observabilidade:** **Sentry** (`@sentry/nextjs`, `instrumentation.ts` + `instrumentation-client.ts`), `error.tsx`/`global-error.tsx`.

---

# 17. Arquitetura da Aplicação

```text
Cliente/Staff (React, Server Components + Client Components)
        ↓  (Server Actions "use server")
Camada de aplicação (lib/orders/create, lib/reports, lib/predictions, actions.ts por rota)
        ↓
Acesso a dados (Supabase client SSR / admin service-role) + RLS no Postgres
        ↘ Realtime (Supabase channels: orders/order_items/waiter_calls)
        ↘ Rate limit (Upstash Redis)
        ↘ IA (Anthropic/Claude) — sobre dados agregados
        ↘ Observabilidade (Sentry)
```
Separação: **apresentação** (componentes), **aplicação** (actions/libs), **regras de negócio** (validação Zod + RLS + funções SQL de stock), **dados** (Supabase/Postgres), **serviços externos** (Anthropic, Upstash, Sentry).

---

# 18. Modelo de Dados

> Fonte: `supabase/migrations/`. Dinheiro em **centavos (int)**. Todas as tabelas de tenant têm `establishment_id`.

**Enums:** `plan_tier (basic|pro|max)`, `staff_role (owner|manager|kitchen|waiter)`, `order_status (draft|placed|in_prep|ready|served|cancelled)`, `payment_status (pending|paid|failed|refunded)`, `payment_method (card|pix|cash; valores antigos mantidos no banco por compatibilidade)`, `waiter_call_status (open|ack|resolved)`, `vat_code (NOR|INT|RED|ISE)`.

> **Estado BR:** `establishments.currency` usa default **BRL**; `payment_method` inclui **`pix`**; valores antigos permanecem apenas por compatibilidade; `vat_code` fica dormente (sem faturamento).

## establishments (tenant)
`id, name, slug (unique), plan, vat_number, currency (def BRL), phone, created_at`

## staff
`id, establishment_id→establishments, auth_user_id→auth.users (unique), role, display_name, created_at`

## restaurant_tables
`id, establishment_id, label, qr_token (unique), active, created_at`

## menu_categories
`id, establishment_id, name, sort, created_at`

## menu_items
`id, establishment_id, category_id→menu_categories, name, description, price_cents(≥0), image_url, available, sort, vat_code, track_stock, stock_qty, low_stock_threshold, created_at`

## modifier_groups
`id, establishment_id, menu_item_id (nullable, grupos reutilizáveis), name, min_select, max_select, sort`

## modifiers
`id, establishment_id, group_id→modifier_groups, name, price_delta_cents, available, sort`

## item_modifier_groups (N:N item↔grupo)
`id, establishment_id, menu_item_id, group_id, sort, unique(menu_item_id, group_id)`

## orders
`id, establishment_id, table_id→restaurant_tables, customer_name, status, subtotal_cents, tip_cents, total_cents, created_at, updated_at, paid_at, closed_at`

## order_items
`id, establishment_id, order_id→orders, menu_item_id (nullable), name_snapshot, unit_price_cents, qty(>0), notes, created_at`

## order_item_modifiers
`id, establishment_id, order_item_id→order_items, modifier_id (nullable), name_snapshot, price_delta_cents`

## payments
`id, establishment_id, order_id, provider, provider_ref, method, amount_cents, tip_cents, status, idempotency_key (unique), created_at, updated_at`

## invoices
`id, establishment_id, payment_id→payments, provider, at_document_ref, pdf_url, status, number, amount_cents, error, created_at`  🔵 (skeleton faturação)

## establishment_invoicing
`establishment_id (PK), provider (def vendus), api_key, register_id, mode, created_at, updated_at`  🔵/🟡 (Vendus removido do fluxo)

## waiter_calls
`id, establishment_id, table_id, status, note, created_at, resolved_at`

## ingredients (Max)
`id, establishment_id, name, stock_qty, low_stock_threshold, created_at`

## recipe_items (Max)
`id, establishment_id, ingredient_id→ingredients, menu_item_id? , modifier_id? (exatamente um), qty(>0)`

## webhook_events
`id, provider, event_id, payload(jsonb), processed_at, created_at, unique(provider,event_id)`  🔵 (pagamento online futuro)

---

# 19. Relacionamentos

```text
establishment (tenant raiz)
  ├── has many staff (auth.users 1:1 via auth_user_id)
  ├── has many restaurant_tables
  ├── has many menu_categories → menu_items → modifier_groups → modifiers
  │        └── menu_items N:N modifier_groups (item_modifier_groups)
  ├── has many orders → order_items → order_item_modifiers
  │        └── order.table_id → restaurant_tables
  ├── has many payments → invoices
  ├── has many waiter_calls
  └── (Max) ingredients → recipe_items (menu_item | modifier)
```
**Propriedade/autorização:** tudo é dono do `establishment`; RLS filtra por `private.auth_establishment_id()`; escrita de config exige `private.auth_is_manager()`. Cliente anónimo não tem acesso direto (só via servidor + `qr_token`).

---

# 20. API

**Ordo NÃO expõe uma API REST própria** — usa **Next.js Server Actions** (`"use server"`) e Server Components; os dados são acedidos via **Supabase client** (com RLS) e, em operações privilegiadas, **service role** no servidor. O **realtime** é via canais Supabase (`postgres_changes` em `orders`/`order_items`/`waiter_calls`).

Principais actions (por área):
* **Cliente:** `placeOrder(token, …)`, `callWaiter(token)`, `getOrderableItems(token)`.
* **Atendimento:** `createStaffOrder`, `markPaid`, `resolveWaiterCall`, `advanceOrder`.
* **Cozinha:** `advanceOrder`, `cancelOrder`, `markPaid`, `resolveWaiterCall`.
* **Auth:** `signIn`, `signOut` (+ recuperar/nova-senha).
* **Gestão:** actions de menu/mesas/equipa/stock/plano/relatórios; `generateDailySummary` (IA).

**Convenção de resposta das actions** (padrão observado): `{ ok: true, … } | { ok: false, error }` (ex.: `StaffOrderResult`). 🟡 [A CONFIRMAR] uniformizar num envelope único de erro com códigos.
🔵 **[ROADMAP]** único endpoint REST previsto: **webhook de pagamento** (`/api/webhooks/payments`) quando o pagamento online voltar.

---

# 21. Integrações Externas

## Supabase
**Objetivo:** Postgres, Auth, RLS, Realtime, Storage. **Auth:** anon key (cliente) + service role (servidor). **Erro:** falha de realtime mostra “a ligar…”; falha de auth → login.

## Anthropic (Claude)
**Objetivo:** resumo diário/insights por IA (plano Max). **Modelo:** `claude-haiku-4-5`. **Auth:** `ANTHROPIC_API_KEY` (plataforma). **Entrada:** dados agregados (sem PII). **Erro:** sem chave → `no_key`; timeout/erro → `error` (degrada sem quebrar a Gestão). Ver §22.

## Upstash Redis
**Objetivo:** rate limiting (pedidos por mesa). **Auth:** URL/token Upstash. **Erro:** 🟡 [A CONFIRMAR] fail-open vs fail-closed quando o Redis está indisponível.

## Sentry
**Objetivo:** erros/observabilidade (client + server).

## 🔵 [ROADMAP] Gateway de pagamento online (BR) — a definir
Haverá pagamento online pelo cliente; **provedor a decidir** (candidatos: **Mercado Pago, Stripe (Pix+cartão), Pagar.me, Asaas**). Documentar auth, **webhooks (Pix + cartão)**, idempotência (`payments.idempotency_key`, `webhook_events`) e fallback. **Faturação:** sem faturação nesta fase (NF-e/NFC-e como possível V2).

---

# 22. Funcionalidades de IA

## Modelo
**Claude `claude-haiku-4-5`** (Anthropic). Racional: resumo de 3–5 frases sobre números já agregados — Haiku é barato e suficiente por restaurante/dia. 🟡 Manter atualizado o ID do modelo (usar o mais recente/estável). Chave da **plataforma** (não por restaurante).

## Objetivo
Resumo inteligente do dia + destaque do mais pedido + previsão de procura + **alerta preditivo de stock** (o que esgota primeiro).

## Entrada
Texto compacto com métricas **agregadas** (hoje/mês/semana, top itens, alertas de stock) — **sem PII de clientes**.

## Saída esperada
Texto **pt-BR**, 3–5 frases, sem markdown/preâmbulo; “não inventar números além dos fornecidos”. O system prompt em `lib/ai.ts` está alinhado ao pt-BR.
🟡 [A CONFIRMAR] evoluir para **saída estruturada** (JSON com `result`/`confidence`/`metadata`) se a UI precisar de campos.

## Prompt
System prompt embutido em `lib/ai.ts`. 🟡 Recomendação: versionar prompts.

## Falhas
`no_key` (sem chave), `error` (timeout/erro/resposta vazia) — a Gestão continua a funcionar sem o resumo. 🟡 [A CONFIRMAR] limites de uso/custo por estabelecimento e cache do resumo diário.

---

# 23. Segurança
Presente/exigido: validação de entradas (**Zod** no servidor); **RLS** multi-tenant (impede acesso horizontal, mesmo por URL/API); autorização **no servidor** (`requireStaff`/`requireManager`/`requirePlan`, não só UI); **service role** só no servidor, nunca no cliente; segredos em env (`.gitignore`, nunca no código); **CSP** apertada (`script/style 'self' + unsafe-inline`, `font-src 'self'`, sem hosts externos → libs bundled); HTTPS em produção (Vercel); **rate limiting** (Upstash); sem stack traces ao utilizador (`error.tsx`); logs relevantes.
🟡 [A CONFIRMAR] rotina de rotação de segredos e das **credenciais de demo** (estão em texto no README — `dono@demo.pt`/`cozinha@demo.pt`) antes de produção.

---

# 24. Privacidade (LGPD — mercado BR)
* **Dados pessoais recolhidos:** staff (email, nome, papel via Supabase Auth); cliente final — **mínimos**: opcionalmente `customer_name` no pedido (sem conta, sem login). IA usa só **agregados sem PII**.
* **Porquê:** operar o serviço (auth, operação, pagamento futuro).
* **Retenção:** definir política de retenção de pedidos/pagamentos.
* **Acesso:** só o próprio estabelecimento (RLS); staff da plataforma via service role (auditar).
* **Exclusão de conta / exportação de dados:** 🟡/🔵 fluxos de “apagar conta” e “exportar dados” (direitos do titular **LGPD**) — há export financeiro (`/gestao/financeiro/export`) mas não um export/erase de titular.
* **Localização/residência:** hoje Supabase **eu-west-3 (Paris/UE)**. Mercado **BR/LGPD** → 🟡 avaliar região mais próxima (ex.: `sa-east-1`/São Paulo) **ou** manter e documentar transferência internacional de dados.

---

# 25. Logging e Observabilidade
Registar: erros de aplicação (Sentry), falhas de integrações (IA/Redis), ações críticas (pagamento, fecho de mesa, mudanças de plano/equipa), autenticação, operações administrativas. **Não** registar senhas, tokens, API keys nem PII desnecessária.
🟡 [A CONFIRMAR] existência de um log estruturado de auditoria (para além do Sentry) para ações administrativas.

---

# 26. Analytics
não há ferramenta de product analytics identificada (só Sentry para erros). Definir ferramenta (ex.: PostHog/Vercel Analytics) e instrumentar eventos:
```text
owner_signed_up, staff_invited, staff_logged_in, onboarding_completed
menu_published, table_created
order_placed (source: qr|staff), order_advanced, order_ready, order_delivered
order_cancelled, waiter_called, payment_marked_paid, table_closed
ai_summary_generated, plan_changed
```
Cada evento com propriedades: `establishment_id`, `role/source`, `plan`, valores agregados (sem PII).

---

# 27. Performance
Presente/metas: páginas operacionais `force-dynamic` (sem cache stale) mas com queries indexadas (índices por `establishment_id`/status/tabela); evitar N+1 (selects aninhados do Supabase); **paginação** para listas grandes (🟡 confirmar em financeiro/insights/pedidos históricos); realtime por refetch (`router.refresh`) em vez de merge manual; imagens otimizadas (Next); libs pesadas bundled (ogl) e fontes self-hosted com `preload:false` fora do login; WebGL pausa fora de vista/reduced-motion.
🟡 [A CONFIRMAR] SLAs específicos e custo/limite da IA.

---

# 28. Testes
* **Unitários (Vitest):** regras de negócio (recálculo de preço, fecho de mesa, gating de plano), validações Zod, utilitários (money). 🟡 [A CONFIRMAR] cobertura atual (`tests/`).
* **Integração:** funções SQL de stock (`reserve/release/decrement`), RLS (acesso cross-tenant negado), criação de pedido.
* **E2E (🟡 a definir ferramenta):** signup → login → onboarding (menu+mesa) → pedido (QR) → cozinha avança → garçom entrega → marcar pago → fecho de mesa → logout.

---

# 29. Critérios Globais de Aceite
Feature concluída quando: comportamento implementado; critérios de aceite atendidos; loading/error/empty tratados; **autorização no servidor** a funcionar (RLS + require*); dados validados (Zod); testes relevantes passam; **lint** passa; **typecheck (tsc)** passa; **build** passa; sem regressões conhecidas.

---

# 30. Definition of Done
```text
[ ] Funcionalidade implementada
[ ] Critérios de aceite atendidos
[ ] Regras de negócio respeitadas (incl. RLS/gating no servidor)
[ ] Casos de borda tratados (loading/empty/error/offline/permissão/dados inválidos)
[ ] Segurança revisada (multi-tenant, segredos, rate limit)
[ ] Testes adicionados e a passar
[ ] Lint a passar
[ ] Typecheck (tsc) a passar
[ ] Build (produção) a passar
[ ] Interface responsiva (mobile/tablet/desktop conforme a tela)
[ ] Estados loading/error/empty implementados
[ ] prefers-reduced-motion respeitado
[ ] Documentação/PRD atualizados
```

---

# 31. Estratégia de Implementação (fases)
> Nota: a **fundação e o core já existem**. As fases abaixo servem para novas features/hardening.

**Fase 1 — Fundação** 🟢 (feito): Next+TS+Tailwind, Supabase (Auth/RLS/Realtime), migrations, lint/typecheck, Vitest.
**Fase 2 — Core** 🟢 (feito): entidades, pedidos (cliente+staff), KDS, atendimento, gestão/menu/mesas/equipa.
**Fase 3 — Integrações** 🟡/🔵: IA (feito, Max); pagamentos online (roadmap); faturação certificada (roadmap); e-mails transacionais 🟡; webhooks (roadmap).
**Fase 4 — Qualidade** 🟡: alargar testes, auditoria de acessibilidade, offline/timeout, observabilidade/analytics.
**Fase 5 — Produção** 🟡: CI/CD (hoje deploy por Vercel CLI — falta pipeline git), ambientes staging, monitorização, rotação de segredos/credenciais demo.

---

# 32. Ordem de Implementação para Agente de Código
1. Ler este PRD **e** o `AGENTS.md`/`CLAUDE.md` (aviso: “this is NOT the Next.js you know” — ler `node_modules/next/dist/docs/` antes de codar).
2. Inspecionar o repo (App Router, Server Actions, Supabase, Tailwind tokens).
3. Identificar stack e convenções (tokens `@theme`, RLS, `lib/*`).
4. Identificar ficheiros a alterar.
5. Verificar incompatibilidades PRD↔código (ver §43: pagamento manual vs online, PT vs BR, Vendus).
6. Elaborar plano.
7. Implementar em pequenas etapas.
8. Correr `tsc`, `eslint`, `vitest`, `next build` após mudanças relevantes.
9. Corrigir regressões antes de avançar.
10. Validar contra os critérios do PRD.
Não introduzir comportamento de produto novo sem registar a suposição.

---

# 33. Princípios para Implementação por IA
Simplicidade; sem abstrações prematuras; **reutilizar** componentes/tokens/`lib` existentes; respeitar a arquitetura (Server Actions + RLS); não duplicar lógica (preço/estado do pedido têm uma fonte); **tipagem estrita**; legível; **autorização no servidor**; só tokens do design system (sem cores hardcoded fora de escopos deliberados); testes para o crítico; correr testes/lint/build antes de concluir. Ambiguidade de baixo impacto → escolha simples + registo; ambiguidade que afete produto/BD/segurança/arquitetura/custo → **sinalizar antes**.

---

# 34. Restrições Técnicas
**Não usar:** cores hardcoded fora de escopos deliberados (usar tokens `@theme`); **CDNs externos** de script/estilo/fonte (a CSP bloqueia — tudo bundled/self-hosted); segredos no código; expor service role no cliente.
**Obrigatório:** Next.js (versão do projeto — ler os docs locais); TypeScript estrito; Supabase + **RLS**; validação **Zod** no servidor; Tailwind v4 com tokens.
**Preferir:** Server Actions a REST; Server Components; realtime por refetch; `prefers-reduced-motion`.

---

# 35. Variáveis de Ambiente (só nomes)
```text
# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=          # só servidor
# App
NEXT_PUBLIC_APP_URL=
# IA
ANTHROPIC_API_KEY=
# Rate limit (Upstash)
UPSTASH_REDIS_REST_URL=             # 🟡 confirmar nomes exatos
UPSTASH_REDIS_REST_TOKEN=
# Observabilidade (Sentry)
SENTRY_DSN= / NEXT_PUBLIC_SENTRY_DSN=  # 🟡 confirmar
# 🔵 ROADMAP / stale (remover do .env.example se não voltarem):
# STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET, NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
# INVOICING_PROVIDER, INVOICING_API_KEY
```
Manter `.env.example` **atualizado** (hoje ainda lista Stripe/Vendus — 🟡 limpar) e nunca commitar credenciais.

---

# 36. Ambientes
* **Desenvolvimento:** `npm run dev` (localhost:3000); Supabase remoto (ou local via Supabase CLI + Docker, aplicando migrations+seed). Seed cria estabelecimento demo + mesas + menu (cliente); staff via signup.
* **Staging:** 🟡 [A CONFIRMAR] — hoje os “previews” são rotas públicas na própria produção, não um ambiente separado. Recomenda-se Preview Deployments do Vercel + projeto Supabase de staging.
* **Produção:** Vercel (`app-pedidos`, alias `app-pedidos-seven.vercel.app`) + Supabase eu-west-3.

---

# 37. Deploy
Hoje: **deploy manual por Vercel CLI** (`vercel --prod`); **sem remote git ligado** (push é feito pelo utilizador; sem auto-deploy por git).
Fluxo-alvo:
```text
PR → Lint → Typecheck → Tests → Build → Preview (Vercel) → Review → Merge → Production
```
🟡 [A CONFIRMAR] ligar o repo GitHub (`ordo`) ao Vercel para CI/CD por git.

---

# 38. Rollback
* **Erro após deploy:** promover o deployment anterior no Vercel (Instant Rollback).
* **Migration problemática:** escrever migrations reversíveis; ter script de reversão; testar em staging antes.
* **Integração quebrada (IA/Redis/pagamento):** degradar com fallback (IA já degrada; rate limit 🟡 definir fail-open/closed).
* **Feature com regressão:** feature flag/gating por plano para desativar rápido. 🟡 [A CONFIRMAR] mecanismo de flags.

---

# 39. Riscos
| Risco | Impacto | Probabilidade | Mitigação |
| --- | --- | --- | --- |
| Código com defaults de Portugal vs mercado **BR** decidido | Médio | Alto | Migrar `currency`→BRL, enum `payment_method` (+`pix`), copy pt-BR, avaliar região (§24) |
| Pagamento online ausente (só manual) | Médio–Alto | Alto | Roadmap claro do gateway; skeleton de BD já pronto |
| RLS mal configurada → vazamento cross-tenant | Alto | Baixo | Testes de RLS; revisão de policies em cada migration |
| Credenciais demo em texto no README | Médio | Alto | Rotacionar/remover antes de produção |
| Custo/limite da IA sem cap | Médio | Médio | Cache do resumo diário; limite por estabelecimento |
| Sem CI/CD por git (deploy manual) | Médio | Médio | Ligar Vercel↔GitHub; pipeline de PR |
| Realtime/offline sem tratamento robusto | Médio | Médio | Definir reconexão/estado offline; testes |
| `.env.example`/deps stale (Stripe/Vendus) | Baixo | Alto | Limpar deps e env não usados |

---

# 40. Dependências
* **Externas:** Supabase (BD/Auth/Realtime/Storage), Anthropic (IA), Upstash (rate limit), Sentry (erros), Vercel (deploy), Google Fonts (via next/font, self-hosted no build).
* **Decisões de negócio (bloqueiam roadmap):** mercado-alvo (PT/BR), gateway de pagamento, provedor de faturação, política de preços dos planos, retenção de dados.

---

# 41. Fora do Escopo do MVP
* Pagamento online in-app (Pix/cartão/Apple Pay) — 🔵 roadmap.
* Faturação certificada automática — 🔵 roadmap.
* Billing automático de assinaturas.
* App nativa; delivery/takeaway; reservas; fidelidade; multi-idioma; multi-unidade (cadeias).
* Integrações POS/ERP/impressora fiscal.

---

# 42. Roadmap
## MVP (🟢 já entregue no essencial)
* Pedido por QR (cliente) + criação pelo balcão.
* KDS (cozinha) + Atendimento (garçom) em tempo real, com alertas.
* Gestão: cardápio, mesas/QR, equipa.
* Pagamento **manual** + fecho de mesa.
* Planos/gating; financeiro/insights (Pro); stock + IA (Max).

## V1.1
* Ligar repo↔Vercel (CI/CD por git); limpar deps/env stale.
* Analytics de produto + eventos.
* Fluxos LGPD (exportar/eliminar dados do titular).
* Estender o visual escuro a `/recuperar`/`/signup`/`/nova-senha`.
* Hardening de offline/timeout e testes E2E.

## V2
* **Pagamento online** pelo cliente (**Pix + cartão + Apple Pay**, gateway BR a definir) + webhooks + idempotência.
* **NF-e/NFC-e (BR)** se/quando a faturação entrar.
* Cache/limites de IA; saída estruturada; mais previsões.
* Multi-unidade/cadeias; e-mails transacionais; app/PWA instalável.

---

# 43. Questões em Aberto

> **Atualizado (2026-08-10):** mercado, pagamento (parcial) e faturação decididos — ver ✅. Propagado para §1, §18, §21, §22, §24, §39, §41–42.

- [x] **Mercado primário: Brasil.** Moeda **BRL (R$)**; métodos: **cartão de crédito, Pix, dinheiro, Apple Pay**; copy **pt-BR**; conformidade **LGPD**.
- [ ] **Pagamento online:** haverá gateway online — **quando e qual** (em aberto). Candidatos BR: **Mercado Pago, Stripe (Pix+cartão), Pagar.me, Asaas**. Hoje o pagamento é **manual**.
- [x] **Faturação: sem faturação nesta fase.** Descartar Vendus/Moloni/InvoiceXpress por agora (skeleton `establishment_invoicing`/`invoices`/`vat_code` fica dormente; **NF-e/NFC-e** como possível V2 no BR).
- [ ] **Preços dos planos** (Basic/Pro/Max) e trial; como se cobra (hoje manual).
- [ ] **Métricas de sucesso/metas** e **North Star**.
- [ ] **Storage** de imagens de itens (Supabase Storage vs URL).
- [ ] **Distinção owner↔manager** (billing/apagar estabelecimento).
- [ ] **Nomes exatos das env** de Upstash/Sentry e limpeza do `.env.example`.
- [ ] **Verificação de email** no signup (hoje auto-confirmado).
- [ ] **Retenção de dados** e fluxos de exclusão/exportação (LGPD).
- [ ] **Rate limit fail-open vs fail-closed** quando o Redis cai.
- [ ] **Cobertura de testes atual** (`tests/`) e ferramenta E2E.

### ✅ Alinhamento brasileiro implementado
- `establishments.currency` usa default `BRL`; o seed também usa BRL.
- `payment_method` inclui `pix`; valores antigos são mantidos no banco apenas para compatibilidade histórica.
- Copy e system prompt da IA estão em **pt-BR**.
- A região Supabase e eventuais transferências internacionais devem ser documentadas conforme a LGPD e a regulamentação da ANPD.
- Faturamento e `vat_code` ficam dormentes nesta versão; NF-e/NFC-e permanece no roadmap.

---

# 44. Glossário
* **Estabelecimento (establishment):** o restaurante = o **tenant**; raiz de todo o isolamento (RLS).
* **Staff:** utilizador autenticado do restaurante (owner/manager/kitchen/waiter).
* **Cliente:** consumidor final anónimo, sem conta, que pede via QR da mesa.
* **KDS:** Kitchen Display System — o painel da cozinha (`/cozinha`).
* **Atendimento:** o painel do garçom (`/atendimento`).
* **Gestão:** área do dono (`/gestao`).
* **qr_token:** token único por mesa que dá acesso ao cardápio dessa mesa.
* **Modificador/Extra:** opção de um item (grupo com min/max; extra com delta de preço).
* **Snapshot:** cópia imutável de nome/preço no momento do pedido.
* **Estado do pedido:** `placed→in_prep→ready→served` (+ `cancelled`).
* **paid_at / closed_at:** carimbo de pagamento / de fecho da sessão da mesa.
* **Plano (basic/pro/max):** nível comercial que desbloqueia features (gating).
* **RLS:** Row-Level Security (Postgres) — isolamento por estabelecimento.
* **Server Action:** função de servidor Next.js (`"use server"`) usada em vez de REST.
* **Realtime:** propagação de mudanças via canais Supabase.

---

# 45. Resumo da sessão — 2026-08-30

## Fluxo do diagnóstico de conversão

- O questionário passou a começar pelo problema de maior impacto no lucro, antes da identificação do lead.
- Foi incluída uma etapa intermediária de leitura preliminar, contextualizada pela resposta sobre o principal desafio.
- A identificação agora aparece depois da entrega inicial de valor, seguida pelas perguntas de qualificação e pelo resultado final.
- O fluxo passou a ter 9 etapas, com progresso acessível e foco automático no primeiro controle de cada etapa.
- As opções passaram a usar `fieldset` e legenda acessível; o cartão de oportunidade respeita a preferência de movimento reduzido já aplicada ao restante da landing page.
- O resultado só é exibido depois da resposta da Server Action. Falhas de envio mantêm as respostas preenchidas e exibem a ação “Tentar novamente”.
- A linguagem do resultado foi ajustada para tratar aderência e perspectiva de lucro como estimativas, não como promessa.

## Validações executadas

- `npm run lint` — aprovado.
- `npm test` — aprovado: 32 testes em 3 arquivos.
- `npm run build` — aprovado com Next.js 16.2.11.
- `git diff --check` — aprovado.
- Navegador no domínio de produção — aprovado: pop-up abriu, foco inicial caiu na primeira opção, a leitura preliminar foi personalizada e o foco da etapa intermediária caiu em “Continuar”.
- Console do navegador — sem mensagens.
- Nenhum lead real foi enviado durante a validação.

## Entrega

- Commit: `33d64ea` (`Improve diagnostic conversion flow`).
- Push para `main` concluído.
- Deployment de produção Vercel: `dpl_GtJPj6tExmgAP8f9zHmVineYbgwF`, estado `READY`.
- Domínio: `https://app-pedidos-seven.vercel.app`.

---

# 48. Resumo da sessão — 2026-08-31 — Alinhamento do frontend de Gestão

## Escopo definido

- Este chat passa a concentrar o trabalho de frontend da página de Gestão e
  das suas subpáginas.
- O escopo atual inclui o shell de Gestão, navegação, hub e as páginas de
  menu, mesas, equipe, pagamentos, faturamento, financeiro, insights, estoque,
  ingredientes, plano e Ordo IA.

## Decisões e estado atual

- A direção visual existente foi mantida como base: tema claro, superfícies
  neutras, acento vermelho da Gestão, tipografia Manrope e sidebar dedicada.
- A estrutura App Router já está organizada em
  `src/app/(staff)/gestao` e as páginas usam o shell compartilhado
  `GestaoShell`.
- A auditoria anterior permanece como referência para priorização: navegação
  mobile, consistência de tokens, estados de loading/erro/vazio, acessibilidade
  de formulários e responsividade de tabelas.

## Validações

- Nenhuma alteração de código foi feita nesta sessão.
- Foram inspecionados a estrutura da área de Gestão, os tokens globais, o
  shell de navegação, páginas representativas e o estado do repositório.

## Pendências

- Definir a primeira subpágina ou fluxo de Gestão a ser refinado e seus
  critérios visuais/funcionais específicos.

---

# 48. Resumo da sessão — 2026-08-30 — Redesign dos cards de Cases

## Mudanças aplicadas

- Os cards de Cases passaram a usar a fachada do restaurante como imagem de fundo em toda a área do card.
- O título fica destacado no estado inicial e os dados do case são revelados com uma transição de hover ou foco no desktop.
- O card ganhou foco por teclado, contorno visível e interação de inclinação preservada.
- Em dispositivos touch, todos os dados permanecem visíveis imediatamente, sem depender de hover.
- A animação respeita `prefers-reduced-motion`.

## Validações e entrega

- `npm run lint`, `npm test` (32 testes), `npm run build` e `git diff --check` — aprovados.
- Browser QA desktop e mobile — aprovado; sem mensagens no console.
- Commit: `0189ad5` (`Redesign cases cards`).
- Push para `main` concluído.
- Deployment de produção Vercel: `dpl_HzaKScRmByLgqquYC2B5KypxHdHP`, estado `READY`.
- Domínio: `https://app-pedidos-seven.vercel.app`.

## Pendências para a próxima etapa

- Corrigir os três apontamentos de acessibilidade observados na auditoria anterior: landmark `<main>`, contraste do número da primeira etapa e área de toque dos indicadores dos carrosséis.
- Acompanhar a entrega real do e-mail no ambiente de produção com um envio autorizado.

---

# 49. Resumo da sessão — 2026-08-30 — Auditoria final de UX e conversão

## Escopo e referências usadas

- Auditoria combinada com as skills instaladas `design-taste-frontend`, `browser-qa`, `frontend-a11y` e `click-path-audit`.
- Revisados: hierarquia da landing, clareza da proposta, CTAs, Cases, FAQ, navegação lateral, modal do diagnóstico, estados de erro, teclado, touch, responsividade, console, rede e performance.
- Nenhum lead real foi enviado durante a auditoria.

## Evidências coletadas em produção

- Domínio auditado: `https://app-pedidos-seven.vercel.app`.
- Deployment atual: `dpl_6wY1zd7k52nhLUX3jGDh4m1Qu4JH`, estado `READY`.
- Lighthouse: desktop e mobile com Accessibility 100, Best Practices 100, SEO 100 e Agentic Browsing 100; 52 auditorias aprovadas e nenhuma falha em cada dispositivo.
- Browser QA: 0 mensagens no console; 28 requisições observadas, todas com status 200 ou 304.
- Logs Vercel das últimas 24 horas: 27 respostas 200, 8 respostas 304 e nenhum log 4xx ou 5xx.
- Mobile em 375 px: `scrollWidth` igual à largura da viewport, sem overflow horizontal; indicadores dos carrosséis com área de toque de 24 × 24 px.
- Performance trace: LCP de 190 ms e CLS 0,00 em laboratório; não há dados de campo no CrUX para esta página.
- Fluxo do diagnóstico: CTA abre o modal centralizado, o foco inicia na primeira opção, a navegação chega ao passo 09 e exibe o botão final habilitado. A validação foi interrompida antes do envio para não criar um lead de teste.
- Carrossel de Cases, carrossel de hubs e FAQ responderam às interações de clique; o FAQ expande a resposta no próprio documento.

## Conclusão

Tecnicamente, a landing está apta para uma rodada controlada de QA comercial. Não foram encontrados bloqueios funcionais, problemas de acessibilidade detectáveis pelo Lighthouse, erros de console, falhas de rede ou overflow mobile.

Eu não iniciaria aquisição paga em escala antes dos ajustes de confiança e medição abaixo. Eles não impedem o uso da página, mas podem reduzir conversão qualificada e dificultar a otimização do funil.

## Recomendações priorizadas

### Alta prioridade — confiança da prova comercial

- Os Cases exibem números exatos como `+200%`, `−60%`, `+31%` e `−72%`, mas continuam sem uma identificação visível de que são exemplos/simulações. Substituir por cases autorizados e comprováveis ou rotular explicitamente como simulação de impacto, com método e período.
- A frase “O único sistema que diminui o trabalho e aumenta a demanda” é uma afirmação absoluta de superioridade. Manter apenas com evidência comparativa; caso contrário, testar uma versão forte, porém verificável.
- Os números do bloco “O diagnóstico olha para” — 7 minutos, 12 pedidos por hora, 36,5% e 5% — devem receber fonte/metodologia visível ou ser apresentados como referências operacionais, evitando que pareçam promessa ou benchmark universal.

### Média prioridade — conversão e UX visual

- No estado inicial dos Cards de Cases em desktop, a maior parte da prova fica escondida até hover/foco e o título aparece muito próximo do rodapé escuro. Manter pelo menos métrica e contexto essenciais visíveis por padrão, ou adicionar uma indicação clara de interação; em touch o conteúdo já fica aberto.
- Instrumentar eventos do funil: clique por posição do CTA, abertura do diagnóstico, avanço/abandono por passo, conclusão, erro de envio e expansão de FAQ. Não há rastreamento de conversão customizado identificável no código atual.
- Fazer um envio autorizado de produção para comprovar a entrega no Resend; a revisão confirmou timeout e retry no código, mas não comprova a entrega end-to-end sem um teste real.

### Baixa prioridade — consistência de navegação

- O clique no item “Diagnóstico” abre o modal, enquanto o acesso direto à âncora `/#contato` continua levando à seção. Definir se esse comportamento de deep-link deve abrir o modal também para manter a expectativa do nome da ação.

## Decisão da sessão

- Status: aprovado tecnicamente, com ressalvas comerciais.
- Não houve alteração no código do produto; esta sessão registrou apenas a auditoria e as pendências no PRD.
- Próxima sequência recomendada: prova dos Cases e das métricas → instrumentação do funil → teste autorizado do envio → nova rodada de aquisição controlada.

---

# 50. Encerramento da sessão — 2026-08-30

## Resumo executivo

- A landing page ficou organizada para prospecção do dono de restaurante, com proposta centrada em mais ritmo operacional, menos equipe e maior margem.
- O fluxo de diagnóstico foi transferido para modal centralizado, com nove etapas, animações, foco inicial acessível, validação, classificação qualitativa e retry quando o envio falha.
- Foram estruturados os hubs de Diferenciais, Cases, Como Funciona, Planos, Diagnóstico e FAQ, além de CTAs distribuídos ao longo da página.
- O menu lateral ficou numerado de 01 a 07, com “Diagnóstico” na linha 06 e “FAQ” na linha 07.
- O envio do diagnóstico está configurado para `otium.sap@gmail.com`, com assunto `Formulário do Sistema ORDO - [NOME DO RESTAURANTE]`.

## Fechamento técnico

- `npm run lint` — aprovado.
- `npm test` — aprovado: 32 testes.
- `npm run build` — aprovado com Next.js 16.2.11.
- `git diff --check` — aprovado.
- Lighthouse desktop e mobile — 100 em Accessibility, Best Practices, SEO e Agentic Browsing.
- Browser QA — sem erros de console, sem falhas de rede e sem overflow horizontal em 375 px.
- Produção — deployment `dpl_6wY1zd7k52nhLUX3jGDh4m1Qu4JH` em estado `READY`.

## Pendências para a próxima sessão

1. Substituir os Cases inventados por resultados autorizados ou identificá-los claramente como simulações.
2. Revisar a afirmação “O único sistema...” conforme as evidências comerciais disponíveis.
3. Adicionar fontes ou metodologia às métricas operacionais apresentadas na landing.
4. Instrumentar o funil de conversão e os abandonos do diagnóstico.
5. Fazer um envio autorizado para validar a entrega end-to-end no Resend.

## Estado final

Sessão encerrada com o produto tecnicamente estável e pronto para QA comercial controlado. O próximo ciclo deve priorizar confiança da prova comercial e mensuração de conversão antes de escalar aquisição.

---

# 46. Resumo da sessão — 2026-08-30 — Ajustes da auditoria

## Mudanças aplicadas

- O resultado do diagnóstico deixou de exibir percentuais automáticos e passou a mostrar apenas “Alto”, “Médio” ou “Inicial” como potencial estimado de melhoria.
- Os percentuais derivados da fórmula fixa também foram removidos do e-mail operacional; a equipe recebe a classificação do lead e as respostas para construir a projeção comercial com dados reais.
- O envio continua dependendo da confirmação da Server Action; em falha, o formulário permanece preenchido e oferece “Tentar novamente”.
- A landing passou a ter landmark `<main>`, contraste corrigido no número do primeiro card do diagnóstico e áreas de toque de 24 px nos indicadores dos carrosséis.
- O item “Diagnóstico” do menu lateral agora abre diretamente o pop-up do questionário.
- O rótulo de `budget` no e-mail foi corrigido para “Peso da equipe na receita”, incluindo a mensagem de validação correspondente.

## Validações executadas

- `npm run lint` — aprovado.
- `npm test` — aprovado: 32 testes em 3 arquivos.
- `npm run build` — aprovado com Next.js 16.2.11.
- `git diff --check` — aprovado.

## Pendência

- Fazer um envio real autorizado para confirmar a entrega do e-mail após as mudanças, sem usar dados de teste de terceiros.

## Entrega e validação de produção

- Commit: `494267a` (`Apply diagnostic audit improvements`).
- Push para `main` concluído.
- Deployment de produção Vercel: `dpl_2jKUcH7Qtvx9sB7dfT5k9EYeThHa`, estado `READY`.
- Lighthouse no domínio de produção: desktop e mobile com acessibilidade 100, boas práticas 100, SEO 100 e agentic browsing 100; 51 auditorias aprovadas e nenhuma falha.
- Browser QA: o item “Diagnóstico” abriu o pop-up diretamente e o questionário iniciou com foco na primeira opção.

---

# 47. Resumo da sessão — 2026-08-30 — Correção do envio no passo final

## Diagnóstico

- A jornada foi reproduzida até o passo 09 sem submissão: a pergunta final e o botão “Quero meu diagnóstico” estavam habilitados.
- O ponto de risco estava na chamada ao Resend, que não possuía tempo-limite; uma resposta pendente podia manter o estado “Enviando diagnóstico…” indefinidamente.

## Correção e validação

- A chamada ao Resend passou a usar `AbortController` com timeout de 12 segundos.
- Timeout ou erro de rede agora retorna uma mensagem recuperável e mantém o botão “Tentar novamente”.
- `npm run lint`, `npm test` (32 testes), `npm run build` e `git diff --check` — aprovados.
- Nenhum envio real foi feito durante a investigação.

## Entrega

- Commit: `a4c088c` (`Prevent diagnostic submission from hanging`).
- Push para `main` concluído.
- Deployment de produção Vercel: `dpl_BuQQpT8MMN2Kp5oGy3unWQPXU6X7`, estado `READY`.
- Domínio: `https://app-pedidos-seven.vercel.app`.
