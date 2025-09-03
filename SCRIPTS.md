# 📜 Scripts do Monorepo Nexa Oper

Este documento lista todos os scripts disponíveis no package.json principal do monorepo.

## 🚀 **Scripts Principais**

### Desenvolvimento

```bash
npm run dev              # Inicia todas as aplicações em modo desenvolvimento
npm run build            # Build de todas as aplicações
npm run lint             # Executa linting em todos os projetos
npm run test             # Executa testes em todos os projetos
npm run clean            # Limpa builds de todos os projetos
```

## 📦 **Instalação de Dependências**

### Instalação Geral

```bash
npm run install:all      # Instala dependências raiz + todos os workspaces
npm run install:workspaces # Instala apenas dependências dos workspaces
```

### Instalação Específica

```bash
npm run install:web      # Instala dependências apenas da aplicação web
npm run install:api      # Instala dependências apenas da API
npm run install:db       # Instala dependências apenas do pacote db
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

## 🗄️ **Scripts de Banco de Dados (Prisma)**

### Geração e Migrações

```bash
npm run db:generate      # Gera cliente Prisma
npm run db:migrate:dev   # Executa migrações de desenvolvimento
npm run db:migrate:deploy # Executa migrações de produção
npm run db:studio        # Abre Prisma Studio
npm run db:reset         # Reseta banco de dados (cuidado!)
```

## 🌐 **Scripts de Aplicações**

### Aplicação Web (Next.js)

```bash
npm run web:dev          # Inicia servidor de desenvolvimento da web
npm run web:build        # Build da aplicação web
npm run web:start        # Inicia servidor de produção da web
```

### API (NestJS)

```bash
npm run api:dev          # Inicia servidor de desenvolvimento da API
npm run api:build        # Build da API
npm run api:start        # Inicia servidor de produção da API
```

## 🛠️ **Scripts de Setup e Reset**

### Setup Inicial

```bash
npm run setup            # Setup completo: instala + gera db + build
npm run setup:dev        # Setup para desenvolvimento: instala + gera db + dev
```

### Reset e Limpeza

```bash
npm run reset            # Reset suave: limpa + reinstala + gera db
npm run reset:hard       # Reset completo: remove node_modules + reinstala tudo
```

## 🔍 **Scripts de Verificação**

### Status e Verificações

```bash
npm run status           # Verifica status dos builds (dry run)
npm run check            # Executa lint + build + test
npm run format           # Formata código com Prettier
npm run format:check     # Verifica formatação do código
```

## 🐳 **Scripts Docker (Opcional)**

```bash
npm run docker:up        # Inicia containers Docker
npm run docker:down      # Para containers Docker
npm run docker:logs      # Mostra logs dos containers
```

## 📋 **Script de Ajuda**

```bash
npm run help             # Lista todos os scripts disponíveis
```

## 🎯 **Fluxos de Trabalho Comuns**

### **Primeira vez no projeto:**

```bash
npm run setup            # Setup completo
```

### **Desenvolvimento diário:**

```bash
npm run dev              # Inicia todas as aplicações
```

### **Após mudanças no schema do banco:**

```bash
npm run db:generate      # Regenera cliente Prisma
npm run build            # Rebuild das aplicações
```

### **Após mudanças de dependências:**

```bash
npm run install:all      # Reinstala todas as dependências
```

### **Limpeza geral:**

```bash
npm run reset            # Reset suave
# ou
npm run reset:hard       # Reset completo (mais agressivo)
```

## ⚠️ **Observações Importantes**

1. **Sempre execute scripts da raiz do monorepo**
2. **Use `npm run db:generate` após mudanças no schema Prisma**
3. **Use `npm run reset` se houver problemas de dependências**
4. **O script `setup` é ideal para novos desenvolvedores**
5. **Use `npm run help` para ver todos os scripts disponíveis**

## 🔧 **Personalização**

Você pode adicionar novos scripts no `package.json` principal ou modificar os existentes conforme
necessário para seu fluxo de trabalho.
