# @nexa-oper/db

Pacote compartilhado de banco de dados com Prisma para o monorepo Nexa Oper.

## 🚀 Características

- **Zero Abstração**: Acesso direto ao Prisma Client
- **Tipos Automáticos**: Exportação direta de todos os tipos do Prisma
- **Multi-file Schema**: Suporte a modelos separados em arquivos
- **Monorepo Ready**: Configurado para ser importado por outros pacotes
- **Sem Build Necessário**: Funciona diretamente com o que o Prisma gera

## 📦 Instalação

```bash
# No pacote que vai usar o db
npm install @nexa-oper/db
```

## 🔧 Uso

### Importação Direta

```typescript
import { PrismaClient, Test } from '@nexa-oper/db';

// Criar instância do Prisma Client
const prisma = new PrismaClient();

// Usar diretamente
const tests = await prisma.test.findMany();
const newTest = await prisma.test.create({
  data: { name: 'Novo Teste' }
});
```

### Importação de Tipos

```typescript
import type { Test, Prisma } from '@nexa-oper/db';

// Tipos do modelo
const test: Test = { id: 1, name: 'Exemplo' };

// Tipos de input para operações
const createData: Prisma.TestCreateInput = { name: 'Novo Teste' };
const updateData: Prisma.TestUpdateInput = { name: 'Nome Atualizado' };
```

### Uso em NestJS

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

## 🏗️ Estrutura

```bash
packages/db/
├── prisma/
│   ├── schema.prisma     # Schema principal
│   └── models/           # Modelos separados
│       └── teste.prisma  # Exemplo de modelo
├── generated/             # Cliente Prisma gerado (automático)
└── package.json          # Configuração do pacote
```

## 🛠️ Scripts

```bash
# Gerar cliente Prisma (sempre execute após mudanças no schema)
npm run generate

# Migrações de desenvolvimento
npm run migrate:dev

# Migrações de produção
npm run migrate:deploy

# Abrir Prisma Studio
npm run studio

# Reset do banco (cuidado!)
npm run db:reset

# Limpar arquivos gerados
npm run clean
```

## 🔄 Fluxo de Desenvolvimento

### 1. Adicionar/Editar Modelos

```prisma
// prisma/models/novo-modelo.prisma
model NovoModelo {
  id    Int     @id @default(autoincrement())
  nome  String
  email String  @unique
}
```

### 2. Atualizar Schema Principal

```prisma
// prisma/schema.prisma
generator client {
  provider = "prisma-client-js"
  output   = "../generated/prisma"
}

datasource db {
  provider = "mysql"
  url      = env("DATABASE_URL")
}

// Modelos separados
include "models/teste.prisma"
include "models/novo-modelo.prisma"
```

### 3. Executar Migrations e Generate

```bash
# Criar e aplicar migration
npm run migrate:dev

# Gerar cliente Prisma
npm run generate
```

### 4. Usar nos Apps

```typescript
// Os tipos estão disponíveis automaticamente!
import { PrismaClient, NovoModelo } from '@nexa-oper/db';

const prisma = new PrismaClient();
const modelos = await prisma.novoModelo.findMany();
```

## 📝 Exemplos de Uso

### CRUD Básico

```typescript
import { PrismaClient, Test } from '@nexa-oper/db';

const prisma = new PrismaClient();

// CREATE
const novoTest = await prisma.test.create({
  data: { name: 'Novo Teste' }
});

// READ
const todos = await prisma.test.findMany();
const porId = await prisma.test.findUnique({ where: { id: 1 } });

// UPDATE
const atualizado = await prisma.test.update({
  where: { id: 1 },
  data: { name: 'Nome Atualizado' }
});

// DELETE
const deletado = await prisma.test.delete({
  where: { id: 1 }
});
```

### Queries Avançadas

```typescript
// Com relacionamentos
const comRelacionamentos = await prisma.test.findMany({
  include: {
    // outros modelos quando existirem
  }
});

// Filtros
const filtrados = await prisma.test.findMany({
  where: {
    name: { contains: 'teste' }
  }
});

// Paginação
const paginados = await prisma.test.findMany({
  skip: 0,
  take: 10,
  orderBy: { name: 'asc' }
});
```

## ⚠️ Importante

- **Sempre execute `npm run generate` após mudanças no schema**
- **Use `migrate:dev` apenas em desenvolvimento**
- **Em produção, use `migrate:deploy`**
- **O pacote exporta diretamente o que o Prisma gera**
- **Não há camada de abstração - acesso direto ao Prisma Client**

## 🔗 Dependências

- `@prisma/client`: Cliente Prisma
- `prisma`: CLI do Prisma (dev dependency)

## 🚨 Troubleshooting

- Execute `npm run generate` no pacote db
- Verifique se o pacote foi instalado corretamente

### Erro: "Type 'Test' not found"

- Execute `npm run generate` no pacote db
- Verifique se o modelo está no schema

### Erro: "Database connection failed"

- Verifique a variável `DATABASE_URL` no `.env`
- Execute `npm run migrate:dev` para criar as tabelas
