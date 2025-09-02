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
      "@nexa-oper/db": ["../../packages/db/generated/prisma"],
      "@nexa-oper/db/*": ["../../packages/db/generated/prisma/*"]
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
import { PrismaClient, Test } from '@nexa-oper/db';
```

### Operações CRUD

```typescript
// Criar instância do Prisma Client
const prisma = new PrismaClient();

// Criar
const newTest = await prisma.test.create({
  data: { name: 'Meu Teste' },
});

// Buscar todos
const tests = await prisma.test.findMany();

// Buscar por ID
const test = await prisma.test.findUnique({
  where: { id: 1 },
});

// Atualizar
const updatedTest = await prisma.test.update({
  where: { id: 1 },
  data: { name: 'Nome Atualizado' },
});

// Deletar
const deletedTest = await prisma.test.delete({
  where: { id: 1 },
});

// Sempre desconectar ao finalizar
await prisma.$disconnect();
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
│   │           └── route.ts # Usa o prisma
│   └── components/
│       └── TestList.tsx    # Componente que usa o prisma
├── package.json
└── tsconfig.json
```

## 🔄 Scripts Disponíveis

```bash
# No pacote db
npm run generate    # Gerar cliente Prisma
npm run migrate:dev # Migração de desenvolvimento
npm run studio     # Abrir Prisma Studio
```

## ⚠️ Importante

1. **Sempre crie uma nova instância** do `PrismaClient` quando necessário
2. **Configure a variável `DATABASE_URL`** corretamente
3. **Execute `npm run generate`** no pacote db após mudanças no schema
4. **O pacote é `private: true`**, então só funciona dentro do monorepo
5. **Sempre desconecte** o cliente com `prisma.$disconnect()`

## 🆘 Solução de Problemas

### Erro: "Cannot find module '@nexa-oper/db'"

- Verifique se o workspace está configurado corretamente
- Execute `npm install` na raiz do monorepo
- Execute `npm run generate` no pacote db

### Erro: "Prisma Client not found"

- Execute `npm run generate` no pacote db
- Verifique se a pasta `generated/prisma` existe
- Não é necessário executar build

### Erro de conexão com banco

- Verifique a variável `DATABASE_URL`
- Teste a conexão diretamente com o banco
- Verifique se o banco está rodando

### Erro: "Type 'Test' not found"

- Execute `npm run generate` no pacote db
- Verifique se o modelo está definido no schema Prisma
- Verifique se o migration foi aplicado
