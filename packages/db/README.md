# @nexa-oper/db

Pacote compartilhado de banco de dados com Prisma para o monorepo Nexa Oper.

## 🚀 Características

- **Singleton Pattern**: Instância única do Prisma Client
- **Tipos TypeScript**: Exportação automática de todos os tipos do Prisma
- **Configuração Inteligente**: Logs automáticos em desenvolvimento
- **Monorepo Ready**: Configurado para ser importado por outros pacotes

## 📦 Instalação

```bash
# No pacote que vai usar o db
npm install @nexa-oper/db
```

## 🔧 Uso

### Importação Básica

```typescript
import { db, prisma } from '@nexa-oper/db';

// Usar o singleton
const users = await db.prisma.user.findMany();

// Ou usar o cliente diretamente
const posts = await prisma.post.findMany();
```

### Importação de Tipos

```typescript
import type { User, Post } from '@nexa-oper/db';

// Ou importar tipos específicos
import type { DatabaseResult } from '@nexa-oper/db/types';
```

### Importação do Cliente

```typescript
import { prismaClient, closePrismaClient } from '@nexa-oper/db/client';

// Para casos especiais onde você precisa de controle direto
await closePrismaClient();
```

## 🏗️ Estrutura

```bash
packages/db/
├── src/
│   ├── index.ts      # Singleton e exportações principais
│   ├── types.ts      # Tipos utilitários
│   └── client.ts     # Cliente Prisma configurado
├── prisma/
│   └── schema.prisma # Schema do banco
├── generated/         # Cliente Prisma gerado
└── dist/             # Código compilado
```

## 🛠️ Scripts

```bash
# Gerar cliente Prisma
npm run generate

# Compilar TypeScript
npm run build

# Modo watch para desenvolvimento
npm run dev

# Limpar build
npm run clean
```

## 🔄 Migrações

```bash
# Desenvolvimento
npm run migrate:dev

# Produção
npm run migrate:deploy

# Abrir Prisma Studio
npm run studio
```

## 📝 Exemplo de Uso

```typescript
// apps/web/src/lib/db.ts
import { db } from '@nexa-oper/db';

export async function getUsers() {
  try {
    const users = await db.prisma.user.findMany({
      include: {
        posts: true,
      },
    });

    return { success: true, data: users };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erro desconhecido',
    };
  }
}
```

## ⚠️ Importante

- Sempre use o singleton `db` para operações normais
- Use `closePrismaClient()` apenas em casos especiais (shutdown, testes)
- O cliente é automaticamente configurado com logs em desenvolvimento
- Todos os tipos são exportados automaticamente do schema Prisma

## 🔗 Dependências

- Prisma Client
- TypeScript (peer dependency)
