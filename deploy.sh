#!/usr/bin/env bash
# ================================================================
# DominaReceita Médica — Deploy one-shot
#   - Cria repo privado no GitHub (gustavoac8/dominareceita)
#   - Faz commit + push de todo o código
#   - Instala Vercel CLI (se faltar)
#   - Deploy do site institucional (site/)  → vercel --prod
#   - Deploy da LP + demos (web/)           → vercel --prod
#   - Deploy do painel Next.js (frontend/)  → vercel --prod
#   - Imprime as URLs finais para o console
#
# Railway (backend NestJS) roda separado — instruções ao final.
# ================================================================
set -euo pipefail

# --- cores ----------------------------------------------------------------
BOLD=$'\033[1m'; GRN=$'\033[32m'; RED=$'\033[31m'; YEL=$'\033[33m'; DIM=$'\033[2m'; CLR=$'\033[0m'
ok()    { echo "${GRN}✔${CLR} $*"; }
info()  { echo "${BOLD}➜${CLR} $*"; }
warn()  { echo "${YEL}!${CLR} $*"; }
fail()  { echo "${RED}✖${CLR} $*"; exit 1; }

# --- checa tokens ---------------------------------------------------------
[[ -z "${GH_TOKEN:-}" ]]      && fail "Defina GH_TOKEN (ghp_...). Ex: GH_TOKEN=ghp_xxx VERCEL_TOKEN=vcp_xxx ./deploy.sh"
[[ -z "${VERCEL_TOKEN:-}" ]]  && fail "Defina VERCEL_TOKEN (vcp_...)."

GH_USER="${GH_USER:-gustavoac8}"
REPO_NAME="${REPO_NAME:-dominareceita}"
BRANCH="main"

info "Deploy DominaReceita Médica → GitHub: ${GH_USER}/${REPO_NAME}"
cd "$(dirname "$0")"

# --- valida token do GitHub ----------------------------------------------
GH_LOGIN=$(curl -fsSL -H "Authorization: Bearer $GH_TOKEN" https://api.github.com/user | sed -n 's/.*"login": *"\([^"]*\)".*/\1/p' | head -1)
[[ -z "$GH_LOGIN" ]] && fail "Token GitHub inválido ou sem escopo 'repo'."
ok   "GitHub conectado como ${GH_LOGIN}"
GH_USER="$GH_LOGIN"

# --- cria repo (ou usa existente) ----------------------------------------
CREATE_RESP=$(curl -s -o /tmp/dr_create.json -w '%{http_code}' \
  -X POST -H "Authorization: Bearer $GH_TOKEN" -H "Accept: application/vnd.github+json" \
  https://api.github.com/user/repos \
  -d "{\"name\":\"$REPO_NAME\",\"private\":true,\"description\":\"DominaReceita Médica — SaaS para clínicas médicas (site + backend + frontend)\",\"auto_init\":false}")
if [[ "$CREATE_RESP" == "201" ]]; then
  ok "Repo privado criado: https://github.com/${GH_USER}/${REPO_NAME}"
elif [[ "$CREATE_RESP" == "422" ]]; then
  warn "Repo já existe, vou reaproveitar."
else
  cat /tmp/dr_create.json; fail "Falha criando repo (HTTP $CREATE_RESP)"
fi

# --- git init + commit + push --------------------------------------------
if [[ ! -d .git ]]; then
  git init -q -b "$BRANCH"
  git config user.email "${GH_USER}@users.noreply.github.com"
  git config user.name  "$GH_USER"
fi
git add -A
if git diff --cached --quiet; then
  warn "Nada novo para commitar."
else
  git commit -q -m "deploy: DominaReceita Médica — full stack (site + backend + frontend)"
  ok "Commit criado."
fi
git remote remove origin 2>/dev/null || true
git remote add origin "https://${GH_USER}:${GH_TOKEN}@github.com/${GH_USER}/${REPO_NAME}.git"
info "Enviando para GitHub…"
git push -u origin "$BRANCH" --force
ok "Código no GitHub: https://github.com/${GH_USER}/${REPO_NAME}"

# --- Vercel CLI ----------------------------------------------------------
if ! command -v vercel >/dev/null 2>&1; then
  info "Instalando Vercel CLI…"
  npm install -g vercel@latest >/dev/null
fi
ok "Vercel CLI $(vercel --version 2>/dev/null) pronto."

deploy_vercel() {
  local dir="$1"; local name="$2"
  echo
  info "Vercel deploy → ${dir} (projeto: ${name})"
  ( cd "$dir" && rm -rf .vercel
    vercel link --yes --token "$VERCEL_TOKEN" --project "$name" >/dev/null 2>&1 || \
    vercel --token "$VERCEL_TOKEN" --yes --name "$name" --scope "$(vercel teams ls --token "$VERCEL_TOKEN" 2>/dev/null | awk 'NR==2{print $1}')" < /dev/null >/tmp/dr_vlog 2>&1 || true
    URL=$(vercel --token "$VERCEL_TOKEN" --yes --prod --name "$name" 2>&1 | tail -20 | grep -Eo 'https://[a-z0-9.-]+\.vercel\.app' | tail -1)
    echo "${GRN}✔${CLR} ${name}: ${BOLD}${URL}${CLR}"
  )
}

deploy_vercel "site" "dominareceita-site"
deploy_vercel "web"  "dominareceita-lp"
deploy_vercel "frontend" "dominareceita-app"

# --- Railway instructions ------------------------------------------------
echo
echo "${BOLD}${YEL}━━━ Próximo passo (manual, 3 min): Railway ━━━${CLR}"
cat <<'EOF'
1) Entre em https://railway.app/new/github
2) Selecione o repo dominareceita → root directory: /backend
3) Em "Variables" cole:
     DATABASE_URL=postgresql://postgres:[SENHA_SUPABASE]@db.gnmjimlceunvpazcewpt.supabase.co:5432/postgres?schema=public&sslmode=require
     JWT_SECRET=$(openssl rand -hex 32)
     NODE_ENV=production
     PORT=3000
4) Railway lê backend/railway.json automaticamente. Roda prisma migrate deploy + sobe a API.
5) Copie a URL pública (api.xxx.up.railway.app) e cole como NEXT_PUBLIC_API_URL no projeto
   dominareceita-app no Vercel (Settings → Environment Variables).
EOF

echo
ok "Deploy do que estava sob meu controle concluído. 🚀"
