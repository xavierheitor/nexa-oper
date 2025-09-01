# Como Instalar e Usar o Pacote @nexa-oper/db

## 📦 Instalação

### 1. Adicionar como dependência

No `package.json` da sua aplicação:

```json
{
  "dependencies": {
    "@nexa-oper/db": "workspace:*"
  }
}
```

### 2. Instalar dependências

```bash
npm install
# ou
yarn install
# ou
pnpm install
```

## 🔧 Configuração

### 1. TypeScript (tsconfig.json)

```json
{
  "compilerOptions": {
    "paths": {
      "@nexa-oper/db": ["../../packages/db/src"],
      "@nexa-oper/db/*": ["../../packages/db/src/*"]
    }
  }
}
```

### 2. Variáveis de Ambiente

Criar arquivo `.env` na raiz da sua aplicação:

```env
DATABASE_URL="mysql://usuario:senha@localhost:3306/banco"
```

## 🚀 Uso Básico

### Importação

```typescript
import { db, prisma } from '@nexa-oper/db';
import type { Test } from '@nexa-oper/db';
```

### Operações CRUD

```typescript
// Criar
const newTest = await db.prisma.test.create({
  data: { name: 'Meu Teste' }
});

// Buscar todos
const tests = await db.prisma.test.findMany();

// Buscar por ID
const test = await db.prisma.test.findUnique({
  where: { id: 1 }
});

// Atualizar
const updatedTest = await db.prisma.test.update({
  where: { id: 1 },
  data: { name: 'Nome Atualizado' }
});

// Deletar
const deletedTest = await db.prisma.test.delete({
  where: { id: 1 }
});
```

## 📁 Estrutura de Arquivos

```bash
sua-app/
├── src/
│   ├── lib/
│   │   └── db.ts          # Importa do pacote compartilhado
│   ├── app/
│   │   └── api/
│   │       └── tests/
│   │           └── route.ts # Usa o db
│   └── components/
│       └── TestList.tsx    # Componente que usa o db
├── package.json
└── tsconfig.json
```

## 🔄 Scripts Disponíveis

```bash
# No pacote db
npm run generate    # Gerar cliente Prisma
npm run build      # Compilar TypeScript
npm run migrate:dev # Migração de desenvolvimento
npm run studio     # Abrir Prisma Studio
```

## ⚠️ Importante

1. **Sempre use o singleton `db`** para operações normais
2. **Configure a variável `DATABASE_URL`** corretamente
3. **Execute `npm run generate`** no pacote db após mudanças no schema
4. **O pacote é `private: true`**, então só funciona dentro do monorepo

## 🆘 Solução de Problemas

### Erro: "Cannot find module '@nexa-oper/db'"

- Verifique se o workspace está configurado corretamente
- Execute `npm install` na raiz do monorepo
- Verifique se o caminho no tsconfig.json está correto

### Erro: "Prisma Client not found"

- Execute `npm run generate` no pacote db
- Verifique se a pasta `generated/prisma` existe
- Verifique se o build foi executado (`npm run build`)

### Erro de conexão com banco

- Verifique a variável `DATABASE_URL`
- Teste a conexão diretamente com o banco
- Verifique se o banco está rodando
