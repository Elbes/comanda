#Requires -Version 5.1
<#
.SYNOPSIS
  Configura o ambiente local do Comanda QR no Windows.

.USAGE
  npm run setup
  # ou
  powershell -ExecutionPolicy Bypass -File scripts/setup.ps1
#>

$ErrorActionPreference = "Stop"
$ProjectRoot = Split-Path -Parent $PSScriptRoot
Set-Location $ProjectRoot

Write-Host ""
Write-Host "=== Comanda QR - Setup local (Windows) ===" -ForegroundColor Cyan
Write-Host ""

# 1. Verificar Docker
Write-Host "[1/4] Verificando Docker..." -ForegroundColor Yellow
try {
    $dockerVersion = docker --version 2>&1
    Write-Host "  OK: $dockerVersion" -ForegroundColor Green
} catch {
    Write-Host "  ERRO: Docker nao encontrado." -ForegroundColor Red
    Write-Host "  Instale o Docker Desktop: https://www.docker.com/products/docker-desktop/" -ForegroundColor Red
    exit 1
}

$dockerInfo = docker info 2>&1
if ($LASTEXITCODE -ne 0) {
    Write-Host "  ERRO: Docker Desktop nao esta rodando. Abra o Docker Desktop e tente novamente." -ForegroundColor Red
    exit 1
}
Write-Host "  OK: Docker esta rodando" -ForegroundColor Green

# 2. Verificar Node
Write-Host "[2/4] Verificando Node.js..." -ForegroundColor Yellow
try {
    $nodeVersion = node --version 2>&1
    Write-Host "  OK: Node $nodeVersion" -ForegroundColor Green
} catch {
    Write-Host "  ERRO: Node.js nao encontrado." -ForegroundColor Red
    Write-Host "  Instale em: https://nodejs.org/" -ForegroundColor Red
    exit 1
}

# 3. Instalar dependencias npm (inclui Supabase CLI local)
Write-Host "[3/4] Instalando dependencias npm..." -ForegroundColor Yellow
npm install
if ($LASTEXITCODE -ne 0) { exit 1 }
Write-Host "  OK: Dependencias instaladas" -ForegroundColor Green

# 4. Criar .env.local se nao existir
if (-not (Test-Path ".env.local")) {
    Copy-Item ".env.example" ".env.local"
    Write-Host "  Criado .env.local a partir de .env.example" -ForegroundColor Green
} else {
    Write-Host "  .env.local ja existe" -ForegroundColor Green
}

# 5. Subir Supabase local
Write-Host "[4/4] Subindo Supabase local (pode demorar na primeira vez)..." -ForegroundColor Yellow
npx supabase start
if ($LASTEXITCODE -ne 0) {
    Write-Host ""
    Write-Host "  ERRO ao subir Supabase. Verifique se o Docker Desktop esta aberto." -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "  Aplicando migrations e seed..." -ForegroundColor Yellow
npx supabase db reset --yes
if ($LASTEXITCODE -ne 0) { exit 1 }

Write-Host ""
Write-Host "=== Setup concluido! ===" -ForegroundColor Green
Write-Host ""
Write-Host "Proximos passos:" -ForegroundColor Cyan
Write-Host "  Terminal 1 (banco ja esta rodando):" -ForegroundColor White
Write-Host "    npm run dev" -ForegroundColor Gray
Write-Host "    # ou: docker compose up" -ForegroundColor Gray
Write-Host ""
Write-Host "  Acesse:" -ForegroundColor White
Write-Host "    App:    http://localhost:3000" -ForegroundColor Gray
Write-Host "    Setup:  http://localhost:3000/gerencia/setup" -ForegroundColor Gray
Write-Host "    Studio: http://127.0.0.1:54323" -ForegroundColor Gray
Write-Host ""
