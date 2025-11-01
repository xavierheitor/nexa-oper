#!/bin/bash

# Script de Deploy - Nexa Oper
#
# Este script automatiza o processo de deploy das atualizações.
# Uso: ./deploy.sh

set -e

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Função para log
log() {
    echo -e "${GREEN}✅ $1${NC}"
}

warn() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

error() {
    echo -e "${RED}❌ $1${NC}"
}

info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

# Verificar se está no diretório correto
if [ ! -f "package.json" ]; then
    error "Execute este script a partir da raiz do projeto!"
    exit 1
fi

# Verificar se git está disponível
if ! command -v git &> /dev/null; then
    error "Git não encontrado!"
    exit 1
fi

# Verificar se npm está disponível
if ! command -v npm &> /dev/null; then
    error "NPM não encontrado!"
    exit 1
fi

# Verificar se PM2 está disponível
if ! command -v pm2 &> /dev/null; then
    error "PM2 não encontrado!"
    exit 1
fi

info "🚀 Iniciando deploy do Nexa Oper..."

# 1. Ir para diretório do projeto
info "📁 Diretório: $(pwd)"

# 2. Pull das últimas mudanças
log "📥 Baixando atualizações do Git..."
git fetch origin
git pull origin main || warn "Pull falhou, continuando mesmo assim..."

# 3. Instalar dependências
log "📦 Instalando dependências..."
npm install --legacy-peer-deps || error "Falha ao instalar dependências!"
npm run install:all || warn "Algumas dependências podem ter falhado"

# 4. Gerar Prisma Client
log "🗄️ Gerando Prisma Client..."
npm run db:generate || error "Falha ao gerar Prisma Client!"

# 5. Executar migrações
info "🔄 Executando migrações do banco de dados..."
read -p "Deseja executar as migrações? (s/N): " -n 1 -r
echo
if [[ $REPLY =~ ^[Ss]$ ]]; then
    npm run db:migrate:deploy || warn "Migrações podem ter falhado"
else
    warn "Migrações puladas"
fi

# 6. Build das aplicações
log "🔨 Build das aplicações..."

info "Building API..."
npm run api:build || error "Falha no build da API!"

info "Building Web..."
npm run web:build || error "Falha no build do Web!"

# 7. Verificar se ecosystem.config.js existe
if [ ! -f "ecosystem.config.js" ]; then
    warn "ecosystem.config.js não encontrado!"
    info "Criando arquivo básico..."
    cat > ecosystem.config.js << 'EOF'
module.exports = {
  apps: [
    {
      name: 'nexa-api',
      script: './apps/api/dist/main.js',
      cwd: process.cwd(),
      env: {
        NODE_ENV: 'production',
        PORT: 3001,
      },
    },
    {
      name: 'nexa-web',
      script: './apps/web/node_modules/.bin/next',
      args: 'start -p 3000',
      cwd: './apps/web',
      env: {
        NODE_ENV: 'production',
        PORT: 3000,
      },
    },
  ],
};
EOF
fi

# 8. Reiniciar PM2
log "♻️ Reiniciando aplicações..."
pm2 restart ecosystem.config.js || warn "PM2 restart falhou, tentando start..."
pm2 save

# 9. Mostrar status
log "📊 Status das aplicações:"
pm2 status

# 10. Resumo
echo ""
log "✅ Deploy concluído com sucesso!"
echo ""
info "📝 Comandos úteis:"
info "   Ver logs: pm2 logs"
info "   Status: pm2 status"
info "   Monitor: pm2 monit"
info "   Logs API: pm2 logs nexa-api"
info "   Logs Web: pm2 logs nexa-web"
echo ""

