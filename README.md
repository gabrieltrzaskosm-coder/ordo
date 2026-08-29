# Ordo — MVP

Sistema de pedidos e pagamento por QR code para restauração. Next.js (App Router)
+ Supabase (Postgres/Auth/Realtime/RLS). Fundação do MVP.

## Stack
- **Next.js 16** (App Router, TypeScript, Tailwind) — web app responsivo.
- **Supabase** — Postgres, Auth, Realtime, RLS multi-tenant.
- **Pagamento atual** — cobrança manual na mesa; Pix e cartão online ficam no roadmap.

## Estrutura
```
src/
  app/
    (cliente)/mesa/[token]/   Fluxo do comensal (menu, pedido, chamar atendente)
    (staff)/cozinha/          Painel de cozinha (realtime — por ligar)
    (staff)/gestao/           Painel do dono (CRUD + financeiro — por ligar)
  lib/
    supabase/                 Clientes: client (browser), server (SSR), admin (service role)
    session/table.ts          qr_token -> mesa + estabelecimento
supabase/
  migrations/                 0001_init.sql (schema), 0002_rls.sql (RLS)
  seed.sql                    Estabelecimento demo + mesas + menu
```

## Modelo de acesso (segurança)
- **Staff**: Supabase Auth + RLS. Só vê o seu estabelecimento. Financeiro e
  edição de menu restritos a `owner`/`manager`.
- **Cliente (anónimo)**: sem login. As operações passam pelo servidor (service
  role) que valida o `qr_token` e restringe à mesa/estabelecimento. Sem políticas
  para o papel `anon` (default deny). Preços recalculados sempre no servidor.

## Projeto Supabase
- **Projeto:** `app-pedidos` (`wetlqdqtsyllvdxafbzh`). A região e as transferências
  internacionais devem ser avaliadas conforme a LGPD e as regras da ANPD.
- Migrations de `supabase/migrations/` e o seed já estão aplicados.

## Correr localmente
1. `.env.local` já tem a URL e a anon key do projeto.
2. Preencher `SUPABASE_SERVICE_ROLE_KEY` — obter no
   [Dashboard > Project Settings > API Keys](https://supabase.com/dashboard/project/wetlqdqtsyllvdxafbzh/settings/api-keys)
   (chave `service_role`). É secreta: fica só no `.env.local`, que está no `.gitignore`.
3. `npm run dev` → http://localhost:3000
   - Cliente demo: `/mesa/demo-mesa-1` e `/mesa/demo-mesa-2`
   - Staff: `/login` → `/cozinha`, `/gestao`

### Contas de teste (só demo — trocar antes de produção)
| Email | Papel | Acesso |
|---|---|---|
| `dono@demo.pt` | owner | Cozinha + Gestão |
| `cozinha@demo.pt` | kitchen | Só Cozinha |

Palavra-passe de ambas: `DemoPedidos2026!`

### Testar no telemóvel
O `npm run dev` mostra a linha `Network:` com o IP local. Esse IP tem de constar
em `allowedDevOrigins` no `next.config.ts`, senão o Next bloqueia os recursos de
dev, a página não hidrata e os botões não reagem.

> Alternativa 100% local: instalar o [Supabase CLI](https://supabase.com/docs/guides/cli)
> + Docker e correr `supabase start`, que aplica `migrations/` e `seed.sql`.

## Fluxo de onboarding (implementado)
1. Dono faz `/signup` → cria conta + estabelecimento, torna-se `owner` e entra na gestão.
2. Em `/gestao/equipa`, o owner cria contas para cozinha/atendimento/gerente.
3. Configura menu e mesas; imprime os QR.

> As contas são criadas já confirmadas (via service role) — sem verificação de
> email nesta fase. Ativar verificação antes de produção.

## Próximos passos (ver plano)
- **Pagamento online (roadmap):** escolher um gateway brasileiro para Pix e cartão.
  Enquanto não existir, os pagamentos são manuais e os totais da gestão representam
  os pedidos registrados.
- **Planos e billing:** gates por `plan`; a cobrança de assinatura ainda é manual.
- Verificação de email + fluxo de troca de palavra-passe do staff.
- Deploy: definir `NEXT_PUBLIC_APP_URL` com o domínio público **antes** de
  imprimir QR codes — os códigos embutem essa URL.
