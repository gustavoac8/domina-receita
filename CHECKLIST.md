# Checklist de credenciais — DominaReceita Médica

Este documento lista **exatamente** o que você precisa para tirar o sistema do modo *stub* (simulação) e ativar cada integração real.

> **Importante:** o sistema funciona 100% em modo stub sem nenhuma dessas credenciais — a IA simulada cria campanhas fake, WhatsApp só loga no console, reviews são geradas. Você pode demonstrar e testar tudo antes de plugar as contas reais.

---

## 1. Inteligência Artificial (Claude ou OpenAI)

Usado em: Diagnóstico IA, geração de sites, geração de artigos SEO, rascunho de respostas a reviews.

| Provedor  | Variáveis                                 | Onde obter                                                  |
| --------- | ----------------------------------------- | ----------------------------------------------------------- |
| Anthropic | `AI_PROVIDER=anthropic` + `AI_API_KEY=sk-ant-...` | https://console.anthropic.com → Settings → API Keys         |
| OpenAI    | `AI_PROVIDER=openai` + `AI_API_KEY=sk-...`        | https://platform.openai.com/api-keys                        |
| Mock      | `AI_PROVIDER=mock` (padrão)                       | — (sem custo, respostas determinísticas)                    |

Modelo padrão: `claude-3-5-sonnet-latest` (Anthropic) ou `gpt-4o-mini` (OpenAI). Altere em `AI_MODEL`.

---

## 2. Meta Ads + Facebook/Instagram Leadgen

Usado em: criação de campanhas META no módulo de Tráfego, webhook de leads de formulários Instant.

Passo a passo:

1. Crie uma conta em https://business.facebook.com
2. Crie um App no https://developers.facebook.com → Tipo **Business**.
3. Adicione o produto **Marketing API** e **Webhooks**.
4. Gere um **Access Token de sistema** com permissões: `ads_management`, `ads_read`, `leads_retrieval`, `pages_show_list`, `pages_manage_metadata`.
5. Pegue o **Ad Account ID** em Gerenciador de Anúncios (formato `act_1234567890`).
6. Pegue o **Page ID** da sua página no Facebook.
7. No app, configure o **Webhook** apontando para `https://SEU_DOMINIO/integrations/meta/webhook` e inscreva o objeto `page` no campo `leadgen`. Use o `META_WEBHOOK_VERIFY_TOKEN` que você definir no `.env`.

Variáveis:

```env
META_ACCESS_TOKEN=EAAB...
META_AD_ACCOUNT_ID=act_1234567890
META_PAGE_ID=123456789012345
META_WEBHOOK_VERIFY_TOKEN=alguma_string_secreta
META_APP_SECRET=seu_app_secret
```

---

## 3. Google Ads

Usado em: criação de campanhas GOOGLE no módulo de Tráfego e sugestão de palavras-chave no SEO.

Passo a passo:

1. Abra conta em https://ads.google.com.
2. Solicite **Developer Token** em https://ads.google.com/aw/apicenter (aprovação pode levar 1–3 dias úteis).
3. Crie um projeto em https://console.cloud.google.com e ative a **Google Ads API**.
4. Crie credenciais OAuth2 (Desktop app) → anote `client_id` e `client_secret`.
5. Gere o `refresh_token` via fluxo OAuth (use o oauth2l ou o script oficial Google).
6. Pegue o **Customer ID** (10 dígitos sem hífen) da conta Ads.

Variáveis:

```env
GOOGLE_ADS_DEVELOPER_TOKEN=abcd1234
GOOGLE_ADS_CLIENT_ID=...apps.googleusercontent.com
GOOGLE_ADS_CLIENT_SECRET=GOCSPX-...
GOOGLE_ADS_CUSTOMER_ID=1234567890
GOOGLE_ADS_REFRESH_TOKEN=1//0g...
```

---

## 4. Google Business Profile (GMB)

Usado em: sincronização de avaliações e publicação de respostas.

Passo a passo:

1. Verifique sua clínica em https://business.google.com.
2. No Google Cloud Console, ative a **Business Profile API** (pode exigir aprovação).
3. Use o mesmo OAuth do Google Ads para gerar access token com escopo `https://www.googleapis.com/auth/business.manage`.
4. Pegue o **Location ID** da sua ficha (formato `accounts/.../locations/...`).
5. Atualize `googlePlaceId` da Clinic no banco com o Place ID público (usado para o link "Avaliar no Google").

Variáveis:

```env
GOOGLE_GMB_ACCESS_TOKEN=ya29...
GOOGLE_GMB_LOCATION_ID=accounts/123/locations/456
```

---

## 5. WhatsApp Cloud API

Usado em: envio de follow-ups, pós-venda, lembretes de retorno. Recebimento de respostas cria LeadActivity.

Passo a passo:

1. No Meta Business Manager, ative **WhatsApp Cloud API** (grátis até 1000 conversas/mês iniciadas pela empresa).
2. Pegue o **Phone Number ID** e o **Access Token permanente**.
3. Configure o webhook: `https://SEU_DOMINIO/integrations/whatsapp/webhook` com o `WHATSAPP_WEBHOOK_VERIFY_TOKEN` definido por você.
4. **Aprove os templates** de mensagem (D0, D2, D5, D10, pós-consulta, retorno) no Meta Business Manager — WhatsApp bloqueia envio de mensagens não-template fora da janela de 24h.

Variáveis:

```env
WHATSAPP_ACCESS_TOKEN=EAAB...
WHATSAPP_PHONE_NUMBER_ID=123456789012345
WHATSAPP_WEBHOOK_VERIFY_TOKEN=outra_string_secreta
```

---

## 6. Banco de dados (Postgres)

Em produção, recomendamos **Supabase** (https://supabase.com) ou **Railway**:

```env
DATABASE_URL=postgresql://user:pass@host:5432/domina_receita?schema=public
```

Depois de configurado, rode:

```bash
cd backend
npx prisma migrate deploy
npm run prisma:seed
```

---

## 7. URL pública

Define a base usada em links de sites publicados, webhooks e QR codes:

```env
PUBLIC_BASE_URL=https://api.suaclinica.com.br
```

---

## Ordem recomendada de ativação

1. IA (Anthropic ou OpenAI) — libera o sistema inteiro.
2. Banco Postgres em produção.
3. WhatsApp Cloud API — dá o maior ROI imediato (follow-ups).
4. Meta Ads + Webhook de Leadgen — capta leads que hoje estão perdidos.
5. Google Ads — ativa intenção de busca.
6. Google Business Profile — dobra a conversão via reputação.

Se qualquer variável estiver ausente, o módulo correspondente opera em **modo stub**: resposta válida, mas sem chamadas externas reais.
