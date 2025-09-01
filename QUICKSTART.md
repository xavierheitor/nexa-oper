# 🚀 Guia de Início Rápido - Nexa Oper

Este guia mostra como começar rapidamente com o monorepo Nexa Oper usando os scripts disponíveis.

## ⚡ **Setup Inicial (Primeira vez)**

```bash
# Clone o repositório
git clone <seu-repo>
cd nexa-oper

# Setup completo (instala + gera db + build)
npm run setup
```

## 🔄 **Desenvolvimento Diário**

```bash
# Iniciar todas as aplicações em modo desenvolvimento
npm run dev

# Ou iniciar aplicações específicas
npm run web:dev      # Apenas a aplicação web
npm run api:dev      # Apenas a API
```

## 🗄️ **Operações de Banco de Dados**

```bash
# Após mudanças no schema Prisma
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

## 📦 **Gerenciamento de Dependências**

```bash
# Instalar todas as dependências
npm run install:all

# Instalar apenas dependências dos workspaces
npm run install:workspaces

# Instalar dependências específicas
npm run install:web      # Apenas web
npm run install:api      # Apenas API
npm run install:db       # Apenas pacote db
```

## 🏗️ **Build e Deploy**

```bash
# Build de todas as aplicações
npm run build

# Build específico
npm run web:build       # Apenas web
npm run api:build       # Apenas API

# Iniciar em modo produção
npm run web:start       # Web
npm run api:start       # API
```

## 🧹 **Limpeza e Reset**

```bash
# Limpeza suave
npm run reset

# Limpeza completa (remove node_modules)
npm run reset:hard
```

## 🔍 **Verificações**

```bash
# Verificar status dos builds
npm run status

# Executar todas as verificações
npm run check

# Formatar código
npm run format

# Verificar formatação
npm run format:check
```

## 📋 **Scripts Mais Úteis**

| Comando               | Descrição                                       |
| --------------------- | ----------------------------------------------- |
| `npm run setup`       | Setup completo para novos desenvolvedores       |
| `npm run dev`         | Inicia todas as aplicações em desenvolvimento   |
| `npm run db:generate` | Regenera cliente Prisma após mudanças no schema |
| `npm run build`       | Build de todas as aplicações                    |
| `npm run reset`       | Limpeza e reinstalação                          |
| `npm run help`        | Lista todos os scripts disponíveis              |

## 🎯 **Fluxos de Trabalho Comuns**

### **Novo desenvolvedor:**

```bash
git clone <repo>
cd nexa-oper
npm run setup
npm run dev
```

### **Após mudanças no schema:**

```bash
npm run db:generate
npm run build
```

### **Problemas de dependências:**

```bash
npm run reset
# ou
npm run reset:hard
```

### **Deploy:**

```bash
npm run build
npm run web:start  # ou api:start
```

## ⚠️ **Dicas Importantes**

1. **Sempre execute scripts da raiz do monorepo**
2. **Use `npm run db:generate` após mudanças no schema Prisma**
3. **Use `npm run reset` se houver problemas de dependências**
4. **O script `setup` é ideal para novos desenvolvedores**
5. **Use `npm run help` para ver todos os scripts disponíveis**

## 🆘 **Solução de Problemas**

### **Erro de dependências:**

```bash
npm run reset
```

### **Erro de build:**

```bash
npm run clean
npm run build
```

### **Erro de banco:**

```bash
npm run db:generate
npm run build
```

### **Problemas persistentes:**

```bash
npm run reset:hard
```

---

**💡 Dica:** Use `npm run help` sempre que precisar lembrar dos scripts disponíveis!
