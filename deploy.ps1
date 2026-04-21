# ================================================================
# DominaReceita Medica - Deploy one-shot (PowerShell / Windows)
#   - Cria repo privado no GitHub
#   - Faz push de todo o codigo
#   - Instala Vercel CLI se faltar
#   - Deploy do site institucional, LP e painel no Vercel
#   - Imprime URLs finais
# Uso:
#   $env:GH_TOKEN="ghp_..."; $env:VERCEL_TOKEN="vcp_..."; .\deploy.ps1
# ================================================================

$ErrorActionPreference = "Stop"

function Ok    { param($m) Write-Host "[OK] $m"    -ForegroundColor Green }
function Info  { param($m) Write-Host "[..] $m"    -ForegroundColor Cyan  }
function Warn  { param($m) Write-Host "[!!] $m"    -ForegroundColor Yellow }
function Fail  { param($m) Write-Host "[xx] $m"    -ForegroundColor Red; exit 1 }

# --- Tokens ---------------------------------------------------------------
if (-not $env:GH_TOKEN)     { Fail 'Defina $env:GH_TOKEN (ghp_...). Ex: $env:GH_TOKEN="ghp_xxx"' }
if (-not $env:VERCEL_TOKEN) { Fail 'Defina $env:VERCEL_TOKEN (vcp_...).' }

$GhToken  = $env:GH_TOKEN
$VcToken  = $env:VERCEL_TOKEN
$RepoName = if ($env:REPO_NAME) { $env:REPO_NAME } else { "dominareceita" }
$Branch   = "main"

Info "Deploy DominaReceita Medica"
Set-Location -Path $PSScriptRoot

# --- Valida token GitHub --------------------------------------------------
try {
  $user = Invoke-RestMethod -Uri "https://api.github.com/user" -Headers @{ Authorization = "Bearer $GhToken"; "User-Agent" = "dominareceita-deploy" }
  $GhUser = $user.login
  Ok "GitHub conectado como $GhUser"
} catch {
  Fail "Token GitHub invalido ou sem escopo 'repo'. $_"
}

# --- Cria repo (ou reaproveita) -------------------------------------------
try {
  Invoke-RestMethod -Uri "https://api.github.com/user/repos" -Method Post -Headers @{ Authorization = "Bearer $GhToken"; Accept = "application/vnd.github+json"; "User-Agent" = "dominareceita-deploy" } -Body (@{
    name = $RepoName
    private = $true
    description = "DominaReceita Medica - SaaS para clinicas medicas"
    auto_init = $false
  } | ConvertTo-Json) | Out-Null
  Ok "Repo privado criado: https://github.com/$GhUser/$RepoName"
} catch {
  if ($_.Exception.Response.StatusCode.value__ -eq 422) {
    Warn "Repo ja existe, reaproveitando."
  } else {
    Fail "Falha criando repo: $_"
  }
}

# --- Git init + commit + push --------------------------------------------
if (-not (Test-Path ".git")) {
  git init -q -b $Branch
  git config user.email "$GhUser@users.noreply.github.com"
  git config user.name  $GhUser
}
git add -A
$changed = (git diff --cached --name-only)
if (-not $changed) {
  Warn "Nada novo para commitar."
} else {
  git commit -q -m "deploy: DominaReceita Medica - full stack"
  Ok "Commit criado."
}
# Git escreve progresso no stderr; com ErrorActionPreference=Stop isso vira erro fatal.
# Isolamos os comandos git aqui usando Continue e checamos $LASTEXITCODE manualmente.
$prevEAP = $ErrorActionPreference
$ErrorActionPreference = "Continue"
try {
  $existingRemotes = @(& git remote 2>$null)
  if ($existingRemotes -contains "origin") {
    & git remote remove origin *>$null
  }
  & git remote add origin "https://${GhUser}:${GhToken}@github.com/$GhUser/$RepoName.git" *>$null
  if ($LASTEXITCODE -ne 0) { throw "git remote add falhou (codigo $LASTEXITCODE)" }

  Info "Enviando para GitHub..."
  & git push -u origin $Branch --force *>$null
  if ($LASTEXITCODE -ne 0) { throw "Push falhou (codigo $LASTEXITCODE)." }
} finally {
  $ErrorActionPreference = $prevEAP
}
Ok "Codigo no GitHub: https://github.com/$GhUser/$RepoName"

# --- Vercel CLI ----------------------------------------------------------
if (-not (Get-Command node -ErrorAction SilentlyContinue)) {
  Fail "Node.js nao encontrado no PATH. Instale em https://nodejs.org (versao LTS), feche e reabra o PowerShell, rode de novo."
}
if (-not (Get-Command vercel -ErrorAction SilentlyContinue)) {
  Info "Instalando Vercel CLI..."
  $prevEAP = $ErrorActionPreference
  $ErrorActionPreference = "Continue"
  try {
    & npm install -g vercel@latest *>$null
    if ($LASTEXITCODE -ne 0) { throw "npm install -g vercel falhou (codigo $LASTEXITCODE)." }
  } finally { $ErrorActionPreference = $prevEAP }
}
$prevEAP = $ErrorActionPreference
$ErrorActionPreference = "Continue"
try { $vver = (& vercel --version 2>&1 | Out-String).Trim() } finally { $ErrorActionPreference = $prevEAP }
Ok "Vercel CLI $vver pronto."

function Deploy-Vercel {
  param($dir, $name)
  Write-Host ""
  Info "Vercel deploy -> $dir (projeto: $name)"
  Push-Location $dir
  $prevEAP = $ErrorActionPreference
  $ErrorActionPreference = "Continue"
  try {
    Remove-Item -Recurse -Force .vercel -ErrorAction SilentlyContinue
    $raw = & vercel --token $VcToken --yes --prod --name $name 2>&1
    $out = ($raw | ForEach-Object { $_.ToString() }) -join "`n"
    $url = ([regex]::Matches($out, 'https://[a-z0-9.-]+\.vercel\.app') | Select-Object -Last 1).Value
    if ($url) {
      Ok "$name : $url"
    } else {
      Warn "$name : deploy feito, mas URL nao capturada. Saida completa:"
      Write-Host $out
    }
  } finally {
    $ErrorActionPreference = $prevEAP
    Pop-Location
  }
}

Deploy-Vercel "site"     "dominareceita-site"
Deploy-Vercel "web"      "dominareceita-lp"
Deploy-Vercel "frontend" "dominareceita-app"

Write-Host ""
Write-Host "====== Proximo passo (manual, 3 min): Railway ======" -ForegroundColor Yellow
@"
1) Abra https://railway.app/new/github
2) Selecione o repo $GhUser/$RepoName -> Root directory: /backend
3) Em Variables cole:
     DATABASE_URL=postgresql://postgres:[SENHA]@db.gnmjimlceunvpazcewpt.supabase.co:5432/postgres?schema=public&sslmode=require
     JWT_SECRET=<use: powershell -Command "-join ((1..32) | %% { '{0:x}' -f (Get-Random -Max 16) })">
     NODE_ENV=production
     PORT=3000
4) Deploy sobe sozinho. Copie a URL publica.
5) No Vercel projeto dominareceita-app adicione NEXT_PUBLIC_API_URL com essa URL e redeploy.
"@

Write-Host ""
Ok "Deploy automatizado concluido."
