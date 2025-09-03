# 🚀 Nexa Oper - Monorepo

Monorepo completo para a aplicação Nexa Oper, contendo aplicações web, API backend e pacotes
compartilhados.

## 📋 Visão Geral

Este monorepo utiliza **npm workspaces** e **Turborepo** para gerenciar múltiplos projetos em um
único repositório:

- **🌐 Web App** - Aplicação Next.js 15 (porta 3000)
- **🔌 API** - Backend NestJS (porta 3001)
- **🗄️ DB Package** - Pacote compartilhado de banco de dados com Prisma

## 🏗️ Estrutura do Projeto

```bash
nexa-oper/
├── apps/
│   ├── web/                 # Aplicação Next.js (porta 3000)
│   └── api/                 # API NestJS (porta 3001)
├── packages/
│   └── db/                  # Pacote compartilhado de banco de dados
├── package.json             # Configuração raiz do monorepo
├── turbo.json               # Configuração do Turborepo
├── tsconfig.base.json       # Configuração TypeScript base
├── eslint.config.js         # Configuração ESLint
├── .prettierrc              # Configuração Prettier
├── QUICKSTART.md            # Guia de início rápido
├── SCRIPTS.md               # Documentação dos scripts
└── README.md                # Este arquivo
```

## ⚡ Setup Inicial (Primeira vez)

### 1. Clone e Instalação

```bash
# Clone o repositório
git clone <seu-repo>
cd nexa-oper

# Setup completo (instala + gera db + build)
npm run setup
```

### 2. Configuração de Ambiente (Variáveis .env)

O monorepo usa uma **hierarquia com herança** para gerenciar variáveis de ambiente, centralizando
configurações comuns e permitindo configurações específicas por aplicação.

#### 📁 Estrutura dos Arquivos de Ambiente

```bash
nexa-oper/
├── .env                    # 🎯 VARIÁVEIS BASE (compartilhadas)
├── apps/web/
│   ├── .env               # 🔄 VARIÁVEIS HERDADAS (DATABASE_URL)
│   └── .env.local         # ⚙️ CONFIGURAÇÕES ESPECÍFICAS DA WEB
└── apps/api/
    └── .env               # ⚙️ CONFIGURAÇÕES ESPECÍFICAS DA API
```

#### 🎯 Arquivo `.env` da Raiz (Variáveis Base)

**Localização**: `nexa-oper/.env` (raiz do monorepo)

**Propósito**: Variáveis compartilhadas por todos os workspaces

**Conteúdo obrigatório**:

```env
# ========================================
# CONFIGURAÇÕES BASE DO MONOREPO
# ========================================

# BANCO DE DADOS (obrigatório para Prisma)
DATABASE_URL="mysql://usuario:senha@localhost:3306/nexa_oper"

# AMBIENTE (obrigatório)
NODE_ENV="development"

# CONFIGURAÇÕES COMPARTILHADAS (opcional)
TZ="America/Sao_Paulo"
PRISMA_LOG_LEVEL="query,error,warn"
```

**⚠️ IMPORTANTE**: Este arquivo é usado pelo pacote `@nexa-oper/db` e deve sempre conter
`DATABASE_URL`.

#### 🔄 Arquivo `apps/web/.env` (Variáveis Herdadas)

**Localização**: `nexa-oper/apps/web/.env`

**Propósito**: Variáveis que a aplicação web precisa herdar da raiz

**Conteúdo obrigatório**:

```env
# ========================================
# VARIÁVEIS HERDADAS DA RAIZ
# ========================================
DATABASE_URL="mysql://usuario:senha@localhost:3306/nexa_oper"
```

**💡 Por que existe**: O Next.js não herda automaticamente variáveis de diretórios superiores, então
precisamos copiar `DATABASE_URL` aqui.

#### ⚙️ Arquivo `apps/web/.env.local` (Configurações Específicas)

**Localização**: `nexa-oper/apps/web/.env.local`

**Propósito**: Configurações específicas da aplicação web

**Conteúdo exemplo**:

```env
# ========================================
# CONFIGURAÇÕES ESPECÍFICAS DA APLICAÇÃO WEB
# ========================================

# URL da API para comunicação frontend -> backend
NEXT_PUBLIC_API_URL="http://localhost:3001"

# Configurações específicas da web (exemplos)
NEXT_PUBLIC_APP_NAME="Nexa Oper"
NEXT_PUBLIC_APP_VERSION="1.0.0"
```

#### ⚙️ Arquivo `apps/api/.env` (Configurações Específicas)

**Localização**: `nexa-oper/apps/api/.env`

**Propósito**: Configurações específicas da API

**Conteúdo exemplo**:

```env
# ========================================
# CONFIGURAÇÕES ESPECÍFICAS DA API
# ========================================

# Porta da API (se diferente do padrão)
PORT=3001

# Configurações específicas da API (exemplos)
API_VERSION="v1"
CORS_ORIGIN="http://localhost:3000"
```

### 3. Fluxo de Herança das Variáveis

```mermaid
graph TD
    A[.env da raiz] --> B[Pacote @nexa-oper/db]
    A --> C[apps/web/.env]
    A --> D[apps/api/.env]

    C --> E[Next.js Web App]
    D --> F[NestJS API]

    G[apps/web/.env.local] --> E
    H[apps/api/.env] --> F
```

**Como funciona**:

1. **Raiz** → **Pacote DB**: Prisma usa diretamente
2. **Raiz** → **Web App**: Via `apps/web/.env` (cópia)
3. **Raiz** → **API**: Via herança automática do NestJS
4. **Específicas** → **Cada App**: Via seus respectivos `.env` e `.env.local`

### 4. Comandos para Configuração Rápida

#### 🔧 Criar Todos os Arquivos de Uma Vez

##### **Opção 1: Usando o arquivo de exemplo**

```bash
# Na raiz do monorepo
cp .env.example .env
# Editar .env com seus valores reais

# Para a aplicação web
echo 'DATABASE_URL="mysql://usuario:senha@localhost:3306/nexa_oper"' > apps/web/.env
echo 'NEXT_PUBLIC_API_URL="http://localhost:3001"' > apps/web/.env.local

# Para a API
echo 'PORT=3001' > apps/api/.env
```

### **Opção 2: Comandos diretos**

```bash
# Na raiz do monorepo
echo 'DATABASE_URL="mysql://usuario:senha@localhost:3306/nexa_oper"' > .env
echo 'NODE_ENV="development"' >> .env

# Para a aplicação web
echo 'DATABASE_URL="mysql://usuario:senha@localhost:3306/nexa_oper"' > apps/web/.env
echo 'NEXT_PUBLIC_API_URL="http://localhost:3001"' > apps/web/.env.local

# Para a API
echo 'PORT=3001' > apps/api/.env
```

#### 🔍 Verificar Configuração

```bash
# Verificar estrutura dos arquivos
echo "=== .env da raiz ===" && cat .env
echo "=== .env da web ===" && cat apps/web/.env
echo "=== .env.local da web ===" && cat apps/web/.env.local
echo "=== .env da API ===" && cat apps/api/.env
```

### 5. Manutenção e Atualizações

#### 🔄 Quando Alterar `DATABASE_URL`

**Sempre altere em 2 lugares**:

1. **`.env` da raiz** (para o pacote DB)
2. **`apps/web/.env`** (para a aplicação web)

```bash
# Exemplo: mudança de banco
# 1. Alterar na raiz
sed -i '' 's/banco_antigo/banco_novo/g' .env

# 2. Alterar na web
sed -i '' 's/banco_antigo/banco_novo/g' apps/web/.env
```

#### 🆕 Adicionar Novas Variáveis Compartilhadas

**Para variáveis usadas por múltiplas aplicações**:

1. Adicione no `.env` da raiz
2. Copie para `apps/web/.env` se necessário para o Next.js

**Para variáveis específicas de uma aplicação**:

1. Adicione apenas no `.env` ou `.env.local` da aplicação específica

### 6. Uso das Variáveis Durante Start e Build

#### 🚀 Durante o Desenvolvimento (`npm run dev`)

**Aplicação Web (Next.js)**:

- Carrega `apps/web/.env` primeiro
- Depois carrega `apps/web/.env.local`
- `DATABASE_URL` vem do `.env` local
- `NEXT_PUBLIC_*` vem do `.env.local`

**API (NestJS)**:

- Carrega `apps/api/.env`
- Herda automaticamente variáveis da raiz
- `DATABASE_URL` vem da raiz
- `PORT` vem do `.env` local

**Pacote DB**:

- Carrega `.env` da raiz
- Usa `DATABASE_URL` para Prisma

#### 🏗️ Durante o Build (`npm run build`)

**Aplicação Web**:

- **Build time**: Usa `DATABASE_URL` para gerar tipos Prisma
- **Runtime**: Usa `DATABASE_URL` para conexões ao banco
- **Static**: `NEXT_PUBLIC_*` são embutidas no bundle

**API**:

- **Build time**: Usa `DATABASE_URL` para validação
- **Runtime**: Usa `DATABASE_URL` para conexões ao banco

**Pacote DB**:

- **Build time**: Usa `DATABASE_URL` para gerar cliente Prisma

#### 📱 Durante o Runtime

**Variáveis Disponíveis**:

```typescript
// Em apps/web (Next.js)
process.env.DATABASE_URL; // ✅ Disponível
process.env.NEXT_PUBLIC_API_URL; // ✅ Disponível (público)
process.env.NODE_ENV; // ✅ Disponível

// Em apps/api (NestJS)
process.env.DATABASE_URL; // ✅ Disponível
process.env.PORT; // ✅ Disponível
process.env.NODE_ENV; // ✅ Disponível

// Em packages/db (Prisma)
process.env.DATABASE_URL; // ✅ Disponível
process.env.PRISMA_LOG_LEVEL; // ✅ Disponível
```

### 7. Troubleshooting de Ambiente

#### ❌ Erro: "Environment variable not found: DATABASE_URL"

**Causas possíveis**:

- Arquivo `.env` da raiz não existe
- `DATABASE_URL` não está definida
- Aplicação web não tem `DATABASE_URL` em seu `.env`

**Soluções**:

```bash
# 1. Verificar se existe
ls -la .env

# 2. Verificar conteúdo
cat .env | grep DATABASE_URL

# 3. Recriar se necessário
echo 'DATABASE_URL="mysql://usuario:senha@localhost:3306/nexa_oper"' > .env
```

#### ❌ Erro: "Cannot find module '@nexa-oper/db'"

**Causa**: Pacote DB não foi gerado ou instalado

**Solução**:

```bash
# Gerar cliente Prisma
npm run db:generate

# Reinstalar dependências
npm run install:all
```

#### 🔍 Verificar Status das Variáveis

```bash
# Verificar se as variáveis estão sendo carregadas
cd apps/web && npm run dev
# Deve mostrar: "Environments: .env, .env.local"

cd apps/api && npm run start:dev
# Deve conectar ao banco sem erros
```

### 8. Exemplos de Configuração por Ambiente

#### 🚀 Desenvolvimento

```env
# .env da raiz
DATABASE_URL="mysql://dev:senha@localhost:3306/nexa_dev"
NODE_ENV="development"
PRISMA_LOG_LEVEL="query,error,warn"

# apps/web/.env.local
NEXT_PUBLIC_API_URL="http://localhost:3001"
NEXT_PUBLIC_APP_ENV="development"

# apps/api/.env
PORT=3001
LOG_LEVEL="debug"
```

#### 🏭 Produção

```env
# .env da raiz
DATABASE_URL="mysql://prod:senha@prod-server:3306/nexa_prod"
NODE_ENV="production"
PRISMA_LOG_LEVEL="error"

# apps/web/.env.local
NEXT_PUBLIC_API_URL="https://api.nexaoper.com"
NEXT_PUBLIC_APP_ENV="production"

# apps/api/.env
PORT=3001
LOG_LEVEL="info"
```

#### 🧪 Teste

```env
# .env da raiz
DATABASE_URL="mysql://test:senha@localhost:3306/nexa_test"
NODE_ENV="test"
PRISMA_LOG_LEVEL="error"

# apps/web/.env.local
NEXT_PUBLIC_API_URL="http://localhost:3001"
NEXT_PUBLIC_APP_ENV="test"

# apps/api/.env
PORT=3001
LOG_LEVEL="error"
```

### 9. Checklist de Configuração

#### ✅ Checklist para Primeira Configuração

- [ ] Criar `.env` na raiz com `DATABASE_URL` e `NODE_ENV`
- [ ] Criar `apps/web/.env` com `DATABASE_URL`
- [ ] Criar `apps/web/.env.local` com `NEXT_PUBLIC_API_URL`
- [ ] Criar `apps/api/.env` com `PORT`
- [ ] Verificar se `npm run dev` funciona sem erros
- [ ] Verificar se `npm run build` funciona sem erros
- [ ] Testar conexão com banco em ambas as aplicações

#### ✅ Checklist para Novos Desenvolvedores

- [ ] Clonar o repositório
- [ ] Executar `npm run setup`
- [ ] Verificar se todos os arquivos `.env` existem
- [ ] Executar `npm run dev` para testar
- [ ] Verificar se não há erros de `DATABASE_URL`

#### ✅ Checklist para Deploy

- [ ] Atualizar `DATABASE_URL` para produção
- [ ] Atualizar `NODE_ENV` para "production"
- [ ] Verificar se `NEXT_PUBLIC_API_URL` aponta para produção
- [ ] Testar build: `npm run build`
- [ ] Verificar se não há variáveis de desenvolvimento expostas

### 10. Boas Práticas

#### 🔒 Segurança

- **Nunca commitar** arquivos `.env` no Git
- **Sempre commitar** arquivo `.env.example` para documentar variáveis necessárias
- Rotacione senhas de banco regularmente
- Use variáveis diferentes para cada ambiente
- Use `.gitignore` para excluir todos os arquivos `.env`

#### 🔧 Manutenção

- **Centralize** variáveis comuns na raiz
- **Documente** todas as variáveis necessárias
- **Valide** variáveis obrigatórias no startup
- **Teste** configurações em todos os ambientes

#### 📱 Desenvolvimento

- Use `NODE_ENV=development` para logs detalhados
- Use `PRISMA_LOG_LEVEL="query,error,warn"` para debug
- Configure `NEXT_PUBLIC_*` apenas para variáveis seguras
- Teste builds e runtime separadamente

## 🔄 Desenvolvimento Diário

### Iniciar Todas as Aplicações

```bash
# Iniciar todas as aplicações em modo desenvolvimento
npm run dev
```

### Iniciar Aplicações Específicas

```bash
# Apenas a aplicação web
npm run web:dev

# Apenas a API
npm run api:dev
```

### Portas das Aplicações

- **Web App**: <http://localhost:3000>
- **API**: <http://localhost:3001>
- **Prisma Studio**: <http://localhost:5555>

## 🗄️ Operações de Banco de Dados

### Scripts Disponíveis

```bash
# Gerar cliente Prisma (sempre execute após mudanças no schema)
npm run db:generate

# Migrações de desenvolvimento
npm run db:migrate:dev

# Migrações de produção
npm run db:migrate:deploy

# Abrir Prisma Studio
npm run db:studio

# Reset do banco (cuidado!)
npm run db:reset
```

### Fluxo de Desenvolvimento com Banco

1. **Editar Schema**: Modificar arquivos em `packages/db/prisma/models/`
2. **Gerar Cliente**: `npm run db:generate`
3. **Criar Migration**: `npm run db:migrate:dev`
4. **Testar**: As aplicações já podem usar os novos tipos

## 📦 Gerenciamento de Dependências

### Instalação Geral

```bash
# Instalar todas as dependências
npm run install:all

# Instalar apenas dependências dos workspaces
npm run install:workspaces
```

### Instalação Específica

```bash
# Apenas web
npm run install:web

# Apenas API
npm run install:api

# Apenas pacote db
npm run install:db
```

### Adicionar Novas Dependências

#### 📦 Instalação em Workspaces Específicos

```bash
# Para a aplicação web (ex: instalar Ant Design)
npm install antd --workspace=apps/web

# Para a API (ex: instalar JWT)
npm install @nestjs/jwt --workspace=apps/api

# Para o pacote DB (ex: instalar validação)
npm install zod --workspace=packages/db

# Para o monorepo como um todo (ex: ferramentas de desenvolvimento)
npm install eslint-plugin-import -w .
```

#### 🎯 Exemplos Práticos

**Instalar Ant Design na aplicação web:**

```bash
npm install antd --workspace=apps/web
```

**Instalar biblioteca de validação na API:**

```bash
npm install class-validator class-transformer --workspace=apps/api
```

**Instalar utilitários no pacote DB:**

```bash
npm install date-fns --workspace=packages/db
```

**Instalar ferramentas de desenvolvimento globalmente:**

```bash
npm install @types/node -w .
```

#### 🔧 Scripts de Instalação Rápida

```bash
# Instalar dependência em todos os workspaces
npm run install:all

# Instalar dependência específica em workspace específico
npm install <pacote> --workspace=<workspace>

# Instalar dependência de desenvolvimento
npm install <pacote> --save-dev --workspace=<workspace>

# Se houver conflitos de dependências, use:
npm install <pacote> --workspace=<workspace> --legacy-peer-deps
```

#### 📋 Workspaces Disponíveis

- `apps/web` - Aplicação Next.js
- `apps/api` - API NestJS
- `packages/db` - Pacote compartilhado de banco de dados
- `.` (raiz) - Dependências globais do monorepo

## 🏗️ Build e Deploy

### Build de Todas as Aplicações

```bash
npm run build
```

### Build Específico

```bash
# Apenas web
npm run web:build

# Apenas API
npm run api:build
```

### Iniciar em Modo Produção

```bash
npm run web:start       # Web
npm run api:start       # API
```

## 🧹 Limpeza e Reset

### Limpeza Suave

```bash
npm run reset
```

### Limpeza Completa

```bash
# Remove node_modules e reinstala tudo
npm run reset:hard
```

## 🔍 Verificações e Qualidade

### Status dos Builds

```bash
# Verificar status dos builds
npm run status

# Executar todas as verificações
npm run check
```

### Formatação e Linting

```bash
# Formatar código
npm run format

# Verificar formatação
npm run format:check

# Executar linting
npm run lint
```

## 🌐 Aplicação Web (Next.js 15)

### Tecnologias

- **Next.js 15** - Framework React com App Router
- **TypeScript** - Linguagem de programação tipada
- **React** - Biblioteca para interfaces de usuário
- **Tailwind CSS** - Framework CSS utilitário

### Estrutura

```bash
apps/web/src/
├── app/                    # App Router (Next.js 13+)
│   ├── layout.tsx         # Layout principal
│   ├── page.tsx           # Página inicial
│   ├── globals.css        # Estilos globais
│   └── favicon.ico        # Ícone da aplicação
├── components/             # Componentes React reutilizáveis
├── lib/                    # Utilitários e configurações
└── types/                  # Definições de tipos TypeScript
```

### Uso do Banco de Dados

```typescript
import { PrismaClient } from '@nexa-oper/db';

// Em Server Components
export default async function Page() {
  const prisma = new PrismaClient();

  try {
    const tests = await prisma.test.findMany();
    return <div>{tests.map(test => <div key={test.id}>{test.name}</div>)}</div>;
  } finally {
    await prisma.$disconnect();
  }
}
```

### API Routes

```typescript
// app/api/tests/route.ts
import { PrismaClient } from '@nexa-oper/db';

export async function GET() {
  const prisma = new PrismaClient();

  try {
    const tests = await prisma.test.findMany();
    return Response.json({ data: tests });
  } finally {
    await prisma.$disconnect();
  }
}
```

## 🔌 API (NestJS)

Tecnologias

- **NestJS** - Framework Node.js para aplicações escaláveis
- **TypeScript** - Linguagem de programação tipada
- **Prisma** - ORM para banco de dados (via pacote compartilhado)

Estrutura

```bash
apps/api/src/
├── app.controller.ts    # Controller principal
├── app.service.ts       # Serviço principal
├── app.module.ts        # Módulo principal
├── main.ts             # Ponto de entrada
└── db/                 # Módulo de banco de dados
    ├── db.service.ts   # Serviço de banco
    ├── db.controller.ts # Controller de banco
    └── db.module.ts    # Módulo de banco
```

Uso do Banco de Dados

```typescript
import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@nexa-oper/db';

@Injectable()
export class DbService implements OnModuleInit, OnModuleDestroy {
  private readonly prisma = new PrismaClient();

  async onModuleInit() {
    await this.prisma.$connect();
  }

  async onModuleDestroy() {
    await this.prisma.$disconnect();
  }

  async findAllTests() {
    return await this.prisma.test.findMany();
  }
}
```

### Endpoints Disponíveis

- **Health Check**: `GET /db/health`
- **Listar Testes**: `GET /db/tests`
- **Buscar Teste**: `GET /db/tests/:id`
- **Criar Teste**: `POST /db/tests`
- **Atualizar Teste**: `PUT /db/tests/:id`
- **Deletar Teste**: `DELETE /db/tests/:id`

## 🗄️ Pacote DB (@nexa-oper/db)

### Características

- **Zero Abstração**: Acesso direto ao Prisma Client
- **Tipos Automáticos**: Exportação direta de todos os tipos do Prisma
- **Multi-file Schema**: Suporte a modelos separados em arquivos
- **Sem Build Necessário**: Funciona diretamente com o que o Prisma gera

Estrutura

```bash
packages/db/
├── prisma/
│   ├── schema.prisma     # Schema principal
│   └── models/           # Modelos separados
│       └── teste.prisma  # Exemplo de modelo
├── generated/             # Cliente Prisma gerado (automático)
└── package.json          # Configuração do pacote
```

### Uso

```typescript
import { PrismaClient, Test } from '@nexa-oper/db';

const prisma = new PrismaClient();

// Operações CRUD
const tests = await prisma.test.findMany();
const newTest = await prisma.test.create({ data: { name: 'Novo' } });

// Sempre desconectar
await prisma.$disconnect();
```

Scripts Disponíveis

```bash
# Gerar cliente Prisma
npm run generate

# Migrações
npm run migrate:dev
npm run migrate:deploy

# Prisma Studio
npm run studio

# Reset do banco
npm run db:reset
```

## 🛠️ Configurações

### TypeScript

O projeto usa uma configuração base compartilhada (`tsconfig.base.json`) que é estendida por cada
workspace:

```json
{
  "extends": "./tsconfig.base.json",
  "compilerOptions": {
    "outDir": "./dist",
    "rootDir": "./src"
  }
}
```

### ESLint

Configuração compartilhada com regras para:

- TypeScript
- React (Next.js)
- NestJS
- Prettier

### Prettier

Configuração para formatação consistente do código:

- Indentação: 2 espaços
- Aspas simples
- Ponto e vírgula obrigatório
- Comprimento máximo de linha: 80

## 🐳 Docker (Opcional)

### Scripts Docker

```bash
npm run docker:up        # Inicia containers Docker
npm run docker:down      # Para containers Docker
npm run docker:logs      # Mostra logs dos containers
```

## 🚨 Troubleshooting

### Problemas Comuns

#### Erro: "Cannot find module '@nexa-oper/db'"

```bash
# Execute no pacote db
npm run generate

# Reinstale dependências
npm run install:all
```

#### Erro: "Type 'Test' not found"

```bash
# Execute no pacote db
npm run generate

# Verifique se o modelo está no schema
# Verifique se o migration foi aplicado
```

#### Erro: "Database connection failed"

```bash
# Verifique DATABASE_URL no .env
# Execute migration
npm run db:migrate:dev
```

#### Porta já em uso

```bash
# Verifique processos rodando
lsof -i :3000
lsof -i :3001

# Mate processos se necessário
kill -9 <PID>
```

### Logs e Debug

```bash
# Ver logs da API
npm run api:dev

# Ver logs da web
npm run web:dev

# Ver status dos builds
npm run status
```

## 📚 Documentação Adicional

- **QUICKSTART.md** - Guia de início rápido
- **SCRIPTS.md** - Documentação completa dos scripts
- **apps/web/README.md** - Documentação da aplicação web
- **apps/api/README.md** - Documentação da API
- **packages/db/README.md** - Documentação do pacote DB

## 🔗 Links Úteis

- [Next.js Documentation](https://nextjs.org/docs)
- [NestJS Documentation](https://docs.nestjs.com)
- [Prisma Documentation](https://www.prisma.io/docs)
- [Turborepo Documentation](https://turbo.build/repo/docs)
- [npm Workspaces](https://docs.npmjs.com/cli/v7/using-npm/workspaces)

## 🤝 Contribuição

1. Faça fork do projeto
2. Crie uma branch para sua feature (`git checkout -b feature/AmazingFeature`)
3. Commit suas mudanças (`git commit -m 'Add some AmazingFeature'`)
4. Push para a branch (`git push origin feature/AmazingFeature`)
5. Abra um Pull Request

## 📄 Licença

Este projeto está sob a licença ISC. Veja o arquivo `LICENSE` para mais detalhes.
