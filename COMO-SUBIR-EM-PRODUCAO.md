# Como subir o DominaReceita em produção

Este guia explica como colocar a plataforma no ar em ~15 minutos. O que já está pronto e o que ainda precisa da sua mão.

## ✅ O que já está feito (pela IA, via MCP)

- Banco PostgreSQL **Supabase** (projeto `gnmjimlceunvpazcewpt`, região `us-east-1`).
- **Todo o schema aplicado** — 21 tabelas, 10 enums, foreign keys, índices.
- **Seed de produção** já populado:
  - Usuário SUPER_ADMIN `gustavoac8@gmail.com` / `Domina@2026`
  - Usuário DOCTOR demo `demo@dominareceita.com` / `Demo@1234`
  - 6 leads de marketing de exemplo (CRM do Gustavo)
  - 7 templates de follow-up padrão (D0, D2, D5, D10, POS_CONSULTA, RETORNO_6M, RETORNO_12M)

Pode confirmar abrindo [supabase.com/dashboard/project/gnmjimlceunvpazcewpt](https://supabase.com/dashboard/project/gnmjimlceunvpazcewpt/editor).

## 🟡 O que falta (um único comando)

O sandbox da IA não tem acesso direto às APIs do GitHub/Vercel/Railway. Por isso os passos finais rodam no **seu** computador.

### Passo 1 — Peguar a senha do Postgres Supabase (30 s)

1. Abra [supabase.com/dashboard/project/gnmjimlceunvpazcewpt/settings/database](https://supabase.com/dashboard/project/gnmjimlceunvpazcewpt/settings/database)
2. Role até **Connection string** → `URI` → copie a `DATABASE_URL` completa (substitua `[YOUR-PASSWORD]` pela senha que você setou ao criar o projeto; se esqueceu, clique em **Reset database password**).

### Passo 2 — Rodar o deploy.sh (10 min)

Abra um terminal na pasta do projeto (macOS/Linux/WSL):

```bash
cd ~/caminho/para/domina-receita-medica

GH_TOKEN=<seu_github_token> \
VERCEL_TOKEN=<seu_vercel_token> \
./deploy.sh
```

O script vai:

1. Criar o repo privado `gustavoac8/dominareceita` no GitHub.
2. Fazer `git push` de todo o código.
3. Instalar o Vercel CLI (se faltar).
4. Fazer **3 deploys em produção no Vercel**:
   - `dominareceita-site` → site institucional (SEO + GEO)
   - `dominareceita-lp`   → landing page de vendas + demos navegáveis
   - `dominareceita-app`  → painel Next.js do médico
5. Imprimir as URLs finais no console.

> **Importante:** esses dois tokens já são os que você me passou aqui. Depois do deploy, revogue-os em [github.com/settings/tokens](https://github.com/settings/tokens) e [vercel.com/account/tokens](https://vercel.com/account/tokens) — eles não precisam ficar vivos.

### Passo 3 — Railway (backend NestJS, 3 min)

1. Abra [railway.app/new/github](https://railway.app/new/github) e autorize o repo `gustavoac8/dominareceita`.
2. Em **Root Directory** selecione `/backend`.
3. Na aba **Variables** cole:

```env
DATABASE_URL=<a string URI do Supabase do passo 1>
JWT_SECRET=<gere com: openssl rand -hex 32>
NODE_ENV=production
PORT=3000
OPENAI_API_KEY=sk-proj-...          # opcional (IA dos módulos)
META_APP_SECRET=...                 # opcional (ADS Meta)
GOOGLE_ADS_DEVELOPER_TOKEN=...      # opcional (ADS Google)
WHATSAPP_API_TOKEN=...              # opcional (follow-ups WhatsApp)
```

4. Railway lê o `backend/railway.json` automaticamente:
   - `npm install && npx prisma generate && npm run build`
   - `npx prisma migrate deploy && node dist/main`
   - Healthcheck em `/health`
5. Copie a URL pública gerada (algo tipo `https://dominareceita-backend.up.railway.app`).

### Passo 4 — Conectar frontend → backend (1 min)

1. No Vercel → projeto `dominareceita-app` → **Settings** → **Environment Variables**
2. Adicione:
   - `NEXT_PUBLIC_API_URL` = `https://sua-url-do-railway.up.railway.app`
3. **Redeploy** (botão no topo).

## 🎯 URLs finais previstas

| Recurso | URL |
|---|---|
| Site institucional (SEO + GEO) | `dominareceita-site.vercel.app` |
| LP de vendas + demos | `dominareceita-lp.vercel.app` |
| Painel do médico (login) | `dominareceita-app.vercel.app` |
| API backend | `dominareceita-backend.up.railway.app` |
| Banco | `db.gnmjimlceunvpazcewpt.supabase.co` |

## 🔐 Credenciais de acesso

| Perfil | E-mail | Senha |
|---|---|---|
| Super admin (você) | gustavoac8@gmail.com | Domina@2026 |
| Médico demo | demo@dominareceita.com | Demo@1234 |

**Troque a senha do super admin no primeiro login.**

## 🧪 Como testar cada coisa

- **Site institucional**: abra `/`, `/especialidades/dermatologia`, `/blog/como-triplicar-faturamento-clinica-90-dias`, `/robots.txt`, `/llms.txt`, `/sitemap.xml`.
- **LP de vendas**: abra `/` (countdown + CTA), `/admin` (preview super admin), `/dashboard` (preview médico).
- **Painel do médico**: login → Visão geral, Diagnóstico, Plano de ação, CRM, Campanhas, Follow-ups.
- **API**: `curl https://<railway>/health` → `{"ok":true,...}`.
- **Super admin**: login com seu e-mail → `/admin/overview`, `/admin/leads` (seu CRM comercial).

## 🆘 Se algo der errado

| Erro | Solução |
|---|---|
| `deploy.sh: Permission denied` | `chmod +x deploy.sh` |
| Vercel pede login | Script usa token automaticamente; se pedir, rode `vercel logout` antes |
| Railway: `prisma migrate deploy` falha | Confira `DATABASE_URL` — a senha do Supabase é case-sensitive |
| Painel não chama a API | Confira `NEXT_PUBLIC_API_URL` no Vercel e faça redeploy |
| CORS bloqueando | Em `backend/src/main.ts` ajuste `app.enableCors({ origin: 'https://dominareceita-app.vercel.app' })` |
