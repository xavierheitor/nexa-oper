# 🚀 Guia de Configuração - Nexa Oper

## 📋 Visão Geral

Este guia contém todas as informações necessárias para configurar, executar e desenvolver no projeto Nexa Oper, um sistema de gestão operacional construído com Next.js, Prisma e arquitetura modular.

## 🏗️ Arquitetura do Projeto

### **Estrutura de Pastas**

```bash
nexa-oper/
├── apps/
│   ├── api/          # Backend NestJS
│   └── web/          # Frontend Next.js
├── packages/
│   └── db/           # Configuração do Prisma
├── QUICKSTART.md     # Guia rápido de início
├── SCRIPTS.md        # Scripts disponíveis
└── SETUP_GUIDE.md    # Este guia
```

### **Tecnologias Utilizadas**

- **Frontend**: Next.js 15, React, TypeScript, Ant Design
- **Backend**: NestJS, Prisma ORM
- **Banco de Dados**: PostgreSQL/MySQL
- **Autenticação**: NextAuth.js
- **Validação**: Zod
- **Build**: Turbo (Monorepo)

## ⚙️ Configuração Inicial

### **1. Pré-requisitos**

```bash
# Node.js (versão 18 ou superior)
node --version  # >= 18.0.0

# npm (versão 9 ou superior)
npm --version   # >= 9.0.0

# Git
git --version
```

### **2. Clonagem e Instalação**

```bash
# Clonar o repositório
git clone <repository-url>
cd nexa-oper

# Instalar dependências (raiz do projeto)
npm install

# Instalar dependências dos workspaces
npm run install:all
```

### **3. Configuração do Banco de Dados**

#### **Configurar Variáveis de Ambiente**

```bash
# Copiar arquivo de exemplo
cp packages/db/.env.example packages/db/.env

# Editar configurações do banco
nano packages/db/.env
```

#### **Exemplo de `.env`**

```env
# Database
DATABASE_URL="postgresql://username:password@localhost:5432/nexa_oper"

# NextAuth
NEXTAUTH_SECRET="your-secret-key-here"
NEXTAUTH_URL="http://localhost:3000"

# Logging
LOG_LEVEL="info"
```

#### **Executar Migrações**

```bash
# Gerar cliente Prisma
npm run db:generate

# Executar migrações
npm run db:migrate

# (Opcional) Popular com dados de teste
npm run db:seed
```

### **4. Configuração do Frontend**

```bash
# Navegar para o frontend
cd apps/web

# Copiar variáveis de ambiente
cp .env.example .env.local

# Configurar variáveis
nano .env.local
```

#### **Exemplo de `.env.local`**

```env
# NextAuth
NEXTAUTH_SECRET="same-as-packages-db"
NEXTAUTH_URL="http://localhost:3000"

# API
NEXT_PUBLIC_API_URL="http://localhost:3001"

# Database (mesmo do packages/db)
DATABASE_URL="postgresql://username:password@localhost:5432/nexa_oper"
```

## 🚀 Executando o Projeto

### **Desenvolvimento**

```bash
# Na raiz do projeto - executa todos os serviços
npm run dev

# Ou executar individualmente:

# Frontend (porta 3000)
npm run dev --workspace=apps/web

# Backend API (porta 3001)
npm run dev --workspace=apps/api

# Banco de dados (studio)
npm run db:studio
```

### **Produção**

```bash
# Build de todos os projetos
npm run build

# Executar em produção
npm run start

# Ou individualmente:
npm run start --workspace=apps/web
npm run start --workspace=apps/api
```

## 🏛️ Arquitetura do Frontend

### **Padrão de Camadas**

```bash
apps/web/src/
├── app/                    # App Router (Next.js 13+)
│   ├── api/               # API Routes
│   ├── dashboard/         # Páginas do dashboard
│   └── layout.tsx         # Layout raiz
├── lib/                   # Lógica de negócio
│   ├── actions/          # Server Actions
│   ├── services/         # Serviços de negócio
│   ├── repositories/     # Acesso a dados
│   ├── schemas/          # Validação Zod
│   ├── hooks/            # Custom Hooks
│   └── types/            # Tipos TypeScript
└── ui/                   # Componentes UI
    ├── components/       # Componentes reutilizáveis
    └── providers/        # Context Providers
```

### **Fluxo de Dados**

```bash
Interface (page.tsx)
    ↓
Hooks (useEntityData)
    ↓
Server Actions (actions/)
    ↓
Services (services/)
    ↓
Repositories (repositories/)
    ↓
Prisma ORM
    ↓
Database
```

### **Padrões Implementados**

#### **1. Repository Pattern**

- **Localização**: `apps/web/src/lib/repositories/`
- **Função**: Abstração do acesso a dados
- **Herança**: `AbstractCrudRepository`

#### **2. Service Pattern**

- **Localização**: `apps/web/src/lib/services/`
- **Função**: Lógica de negócio e validação
- **Herança**: `AbstractCrudService`

#### **3. Server Actions**

- **Localização**: `apps/web/src/lib/actions/`
- **Função**: Interface entre frontend e backend
- **Padrão**: `handleServerAction`

#### **4. Schema Validation**

- **Localização**: `apps/web/src/lib/schemas/`
- **Função**: Validação de dados com Zod
- **Padrões**: Create, Update, Filter schemas

## 🛠️ Ferramentas de Desenvolvimento

### **Scripts Disponíveis**

```bash
# Desenvolvimento
npm run dev                 # Executar em modo desenvolvimento
npm run dev:web            # Apenas frontend
npm run dev:api            # Apenas backend

# Build e Produção
npm run build              # Build de todos os projetos
npm run start              # Executar em produção
npm run build:web          # Build apenas frontend
npm run start:web          # Start apenas frontend

# Banco de Dados
npm run db:generate        # Gerar cliente Prisma
npm run db:migrate         # Executar migrações
npm run db:reset           # Reset do banco
npm run db:studio          # Abrir Prisma Studio
npm run db:seed            # Popular com dados de teste

# Qualidade de Código
npm run lint               # Executar ESLint
npm run lint:fix           # Corrigir problemas automáticos
npm run type-check         # Verificar tipos TypeScript
npm run format             # Formatar código com Prettier

# Testes
npm run test               # Executar testes
npm run test:watch         # Executar testes em modo watch
npm run test:coverage      # Executar testes com coverage
```

### **Comandos Úteis**

```bash
# Adicionar nova dependência
npm install <package> --workspace=apps/web

# Adicionar dependência de desenvolvimento
npm install <package> -D --workspace=apps/web

# Executar comando em workspace específico
npm run <script> --workspace=<workspace-name>

# Limpar node_modules e reinstalar
npm run clean && npm install
```

## 🔧 Configurações Avançadas

### **TypeScript**

```json
// tsconfig.json (raiz)
{
  "extends": "./tsconfig.base.json",
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@/*": ["apps/web/src/*"],
      "@nexa-oper/db": ["packages/db"]
    }
  }
}
```

### **ESLint**

```javascript
// eslint.config.js
module.exports = {
  extends: [
    "next/core-web-vitals",
    "@typescript-eslint/recommended"
  ],
  rules: {
    "@typescript-eslint/no-unused-vars": "error",
    "@typescript-eslint/no-explicit-any": "warn"
  }
};
```

### **Prisma**

```prisma
// packages/db/prisma/schema.prisma
generator client {
  provider = "prisma-client-js"
  output   = "../generated/prisma"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}
```

## 🐛 Troubleshooting

### **Problemas Comuns**

#### **1. Erro de Conexão com Banco**

```bash
# Verificar se o banco está rodando
npm run db:studio

# Verificar variáveis de ambiente
cat packages/db/.env

# Regenerar cliente Prisma
npm run db:generate
```

#### **2. Erro de Tipos TypeScript**

```bash
# Verificar tipos
npm run type-check

# Limpar cache do TypeScript
rm -rf .next
npm run build
```

#### **3. Erro de Dependências**

```bash
# Limpar e reinstalar
npm run clean
npm install

# Verificar versões
npm list --depth=0
```

### **Logs e Debugging**

```bash
# Ver logs detalhados
DEBUG=* npm run dev

# Logs do banco de dados
npm run db:studio

# Logs da aplicação
tail -f apps/web/logs/app.log
```

## 📚 Recursos Adicionais

### **Documentação**

- [Next.js Docs](https://nextjs.org/docs)
- [Prisma Docs](https://www.prisma.io/docs)
- [Ant Design Docs](https://ant.design/docs/react/introduce)
- [Zod Docs](https://zod.dev/)

### **Arquivos de Referência**

- `QUICKSTART.md` - Início rápido
- `SCRIPTS.md` - Lista completa de scripts
- `MODULE_CREATION_GUIDE.md` - Guia de criação de módulos
- `INCLUDES_GUIDE.md` - Sistema de includes dinâmicos

### **Estrutura de Commits**

```bash
# Padrão de commits
feat: adicionar nova funcionalidade
fix: corrigir bug
docs: atualizar documentação
style: formatação de código
refactor: refatorar código
test: adicionar testes
chore: tarefas de manutenção
```

## 🎯 Próximos Passos

1. **Ler o QUICKSTART.md** para início rápido
2. **Seguir o MODULE_CREATION_GUIDE.md** para criar novos módulos
3. **Consultar o INCLUDES_GUIDE.md** para usar includes dinâmicos
4. **Explorar os exemplos** nos módulos existentes (Contrato, Veiculo, TipoVeiculo)

---

**🚀 Projeto configurado com sucesso! Agora você está pronto para desenvolver!**
