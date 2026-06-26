#!/usr/bin/env bash
# Copia os templates de produção para os paths usados pelo PM2 e Prisma.
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "${SCRIPT_DIR}/../.." && pwd)"

API_DEST="${REPO_ROOT}/apps/api/.env"
WEB_DEST="${REPO_ROOT}/apps/web/.env.local"
DB_DEST="${REPO_ROOT}/packages/db/.env"

copy_if_missing() {
  local src="$1"
  local dest="$2"
  local label="$3"

  if [[ -f "${dest}" ]]; then
    echo "⚠️  ${label} já existe — mantido: ${dest}"
    return
  fi

  cp "${src}" "${dest}"
  echo "✅ ${label} criado: ${dest}"
}

echo ""
echo "Nexa Oper — preparação de .env de produção"
echo "Repositório: ${REPO_ROOT}"
echo ""

copy_if_missing "${SCRIPT_DIR}/api.env.template" "${API_DEST}" "API"
copy_if_missing "${SCRIPT_DIR}/web.env.local.template" "${WEB_DEST}" "Web"
copy_if_missing "${SCRIPT_DIR}/db.env.template" "${DB_DEST}" "Prisma/DB"

echo ""
echo "Próximos passos:"
echo "  1. Edite DATABASE_URL, JWT_SECRET e NEXTAUTH_SECRET nos arquivos acima"
echo "  2. Gere secrets: openssl rand -base64 48"
echo "  3. Crie a pasta de uploads: mkdir -p ${REPO_ROOT}/uploads"
echo "  4. Rode migrations: npm run db:migrate:deploy"
echo "  5. Build: npm run build"
echo "  6. PM2: pm2 start ${REPO_ROOT}/ecosystem.config.js"
echo ""
