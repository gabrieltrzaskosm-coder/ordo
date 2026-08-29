<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

## Protocolo de encerramento de sessão

- Ao final de cada sessão de trabalho, atualizar o `PRD.md` para refletir as
  decisões, mudanças e o estado atual do produto.
- Acrescentar ao PRD um resumo datado da sessão, incluindo o que foi feito,
  validações executadas, decisões tomadas e pendências.
- Se não houver alterações de código, ainda assim registrar no PRD as decisões
  e conclusões relevantes da sessão.
- Ao final de uma sessão com alterações, executar as validações do projeto e,
  se estiverem aprovadas, fazer commit e push para o GitHub e deploy de produção
  na Vercel. Nunca incluir segredos, `.env.local` ou credenciais no commit.
- Se GitHub, Vercel, Supabase ou outra dependência externa estiver indisponível,
  registrar o bloqueio no resumo da sessão em vez de simular a conclusão.
