#!/usr/bin/env bash
# Deploy completo em produção (rodar no servidor, dentro do repositório).
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "${REPO_ROOT}"

echo ""
echo "=== Nexa Oper — deploy produção ==="
echo "Repo: ${REPO_ROOT}"
echo ""

if [[ ! -f "${REPO_ROOT}/apps/api/.env" ]]; then
  echo "❌ apps/api/.env não encontrado."
  echo "   Rode antes: bash deploy/production/install-env.sh"
  exit 1
fi

if [[ ! -f "${REPO_ROOT}/apps/web/.env.local" ]]; then
  echo "❌ apps/web/.env.local não encontrado."
  echo "   Rode antes: bash deploy/production/install-env.sh"
  exit 1
fi

if grep -q 'PREENCHER' "${REPO_ROOT}/apps/api/.env" 2>/dev/null; then
  echo "❌ apps/api/.env ainda contém placeholders PREENCHER."
  exit 1
fi

if grep -q 'PREENCHER' "${REPO_ROOT}/apps/web/.env.local" 2>/dev/null; then
  echo "❌ apps/web/.env.local ainda contém placeholders PREENCHER."
  exit 1
fi

mkdir -p "${REPO_ROOT}/uploads" "${REPO_ROOT}/logs"

echo "→ npm ci"
npm ci

echo "→ prisma generate"
npm run db:generate

echo "→ migrations"
npm run db:migrate:deploy

echo "→ build"
npm run build

if pm2 describe nexa-api >/dev/null 2>&1; then
  echo "→ pm2 reload"
  pm2 reload ecosystem.config.js
else
  echo "→ pm2 start"
  pm2 start ecosystem.config.js
fi

echo ""
echo "✅ Deploy concluído"
echo ""
echo "Health checks:"
echo "  curl -i http://127.0.0.1:3001/__ping"
echo "  curl -I http://127.0.0.1:3000"
echo ""
