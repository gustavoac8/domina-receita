# DominaReceita Médica

Sistema full-stack para aumentar o faturamento de clínicas médicas em 3x–5x em 90–120 dias via marketing digital + funil de vendas automatizado.

## Módulos (Sprint 1 + Sprint 2)

| # | Módulo | Status |
|---|--------|--------|
| 1 | Diagnóstico IA de Concorrentes | ✅ |
| 2 | Briefing + Geração de Site (com publicação e export ZIP) | ✅ |
| 3 | CRM + Funil de Leads (kanban) | ✅ |
| 4 | Tráfego ADS (Meta + Google reais) + Dashboard ROI | ✅ |
| 5 | SEO & Conteúdo (auditoria + keywords + geração de artigos) | ✅ |
| 6 | Plano de 90 dias (roadmap semanal + KPIs) | ✅ |
| 7 | Follow-ups automáticos (D0/D2/D5/D10) via WhatsApp | ✅ |
| 8 | Vendas & Agendamento (scripts + agenda) | ✅ |
| 9 | Gestão de Avaliações (Google Business Profile) | ✅ |
| 10 | Pós-venda & Retenção (lembretes de retorno) | ✅ |
| 11 | Indique-e-Ganhe (códigos + tracking + pagamento) | ✅ |

## Stack

- **Backend:** Node.js 20 + NestJS 10 + Prisma 5 + PostgreSQL 16 + JWT + `@nestjs/schedule` (cron in-process) + JSZip
- **Frontend:** Next.js 15 (App Router) + React 19 + Tailwind CSS 3 + TypeScript
- **Banco:** PostgreSQL via Docker Compose (local) ou Supabase/Railway (produção)
- **IA:** adapter `AiProvider` com modos `mock` | `anthropic` | `openai`
- **Integrações reais:** Meta Graph API v19, Google Ads API, Google Business Profile, WhatsApp Cloud API — todas com *fallback stub* quando credenciais não estão configuradas

## Estrutura

```
domina-receita-medica/
├── backend/                 # API NestJS
│   ├── prisma/              # schema + seed (7 templates de follow-up incluídos)
│   └── src/
│       ├── auth/ users/ clinics/
│       ├── diagnostico/ briefing/ sites/
│       ├── crm/ campaigns/ analytics/
│       ├── plans/           # Plano 90 dias
│       ├── seo/             # Auditoria + keywords + artigos
│       ├── followups/       # Templates + agendamento + sequência D0/D2/D5/D10
│       ├── sales/           # Scripts + agendamento
│       ├── reviews/         # Google Business
│       ├── postsales/       # Lembretes de retorno
│       ├── referrals/       # Indique-e-Ganhe
│       ├── integrations/
│       │   ├── meta/        # Ads + Webhook Leadgen
│       │   ├── google/      # Ads + GMB
│       │   └── whatsapp/    # Cloud API + webhook
│       ├── queue/           # Workers cron (follow-up + retornos)
│       └── ai/              # Adapter IA
├── frontend/                # Next.js 15 (App Router)
│   └── src/app/dashboard/   # 11 páginas (uma por módulo)
├── docker-compose.yml
├── CHECKLIST.md             # Credenciais necessárias para ativar integrações reais
└── README.md
```

## Como rodar localmente

```bash
# 1. Subir o Postgres
docker compose up -d

# 2. Backend
cd backend
cp .env.example .env
npm install
npx prisma migrate dev --name init
npx prisma db seed
npm run start:dev
# → http://localhost:4000 (Swagger em /api/docs)

# 3. Frontend
cd ../frontend
cp .env.example .env.local
npm install
npm run dev
# → http://localhost:3000
```

### Credenciais de teste (após `prisma db seed`)

- **E-mail:** `demo@dominareceita.com`
- **Senha:** `Demo@1234`

## Modo Stub ↔ Modo Real

Todas as integrações **funcionam em modo stub** sem nenhuma credencial:

- Campanhas Meta/Google são criadas com `externalId` fake.
- WhatsApp loga no console ao invés de enviar.
- Reviews são geradas fake para você testar o fluxo.
- Keywords vêm de um gerador heurístico.

Para ativar o modo real, preencha as variáveis no `.env` conforme **[CHECKLIST.md](./CHECKLIST.md)**. Cada serviço detecta as credenciais e troca automaticamente para modo real.

## Endpoints principais (novos no Sprint 2)

| Método | Rota | Descrição |
|--------|------|-----------|
| POST | `/plans/generate` | Gera plano de 90d completo |
| GET  | `/seo/audit?url=` | Auditoria SEO |
| GET  | `/seo/keywords?seed=` | Ideias de keywords |
| POST | `/seo/articles` | Gera artigo SEO com IA |
| GET  | `/followups/templates` | Templates de follow-up |
| POST | `/followups/leads/:id/enqueue-default` | Agenda D0/D2/D5/D10 automaticamente |
| GET  | `/sales/scripts` | Scripts de venda prontos |
| POST | `/sales/appointments` | Criar agendamento |
| GET  | `/reviews?clinicId=` | Listar avaliações |
| POST | `/reviews/sync` | Sincronizar Google Business |
| POST | `/reviews/:id/reply-draft` | Rascunho de resposta com IA |
| GET  | `/postsales/reminders` | Lembretes de retorno |
| POST | `/postsales/reminders` | Agendar retorno 6m/12m |
| POST | `/referrals` | Gerar código de indicação |
| GET  | `/referrals/stats` | KPIs de indicações |
| GET  | `/sites/:id/export` | Exportar site como ZIP |
| POST | `/integrations/meta/webhook` | Webhook leadgen Facebook/Instagram |
| POST | `/integrations/whatsapp/webhook` | Webhook WhatsApp Cloud |

Swagger completo: `http://localhost:4000/api/docs`

## Workers em background

- **followup.worker** — tick a cada 1 minuto, envia até 20 follow-ups pendentes.
- **reminders.worker** — tick a cada 1 hora, dispara lembretes de retorno vencidos.

Ambos usam `@nestjs/schedule` (in-process, sem Redis). Em escala maior, troque por BullMQ.

## Deploy recomendado

- **Frontend:** Vercel (zero config para Next.js 15).
- **Backend:** Railway ou Fly.io (precisa de processo *long-lived* para os workers cron).
- **Banco:** Supabase (Postgres + pooling + backups).
- **Storage para sites publicados** (opcional): Vercel Static ou S3/Cloudflare R2.

## Licença

Proprietária — uso interno.
