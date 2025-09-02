# API - Nexa Oper

API backend da aplicação Nexa Oper, construída com NestJS.

## 🚀 Tecnologias

- **NestJS** - Framework Node.js para aplicações escaláveis
- **TypeScript** - Linguagem de programação tipada
- **Prisma** - ORM para banco de dados (via pacote compartilhado `@nexa-oper/db`)

## 📦 Instalação

```bash
# Instalar dependências
npm install

# Gerar cliente Prisma (se necessário)
npm run db:generate
```

## 🔧 Scripts Disponíveis

```bash
# Desenvolvimento
npm run start:dev    # Modo watch
npm run start        # Modo normal
npm run start:prod   # Modo produção

# Build
npm run build        # Compilar TypeScript

# Testes
npm run test         # Testes unitários
npm run test:e2e     # Testes end-to-end
npm run test:cov     # Cobertura de testes
```

## 🌐 Estrutura da API

```bash
src/
├── app.controller.ts    # Controller principal
├── app.service.ts       # Serviço principal
├── app.module.ts        # Módulo principal
└── main.ts             # Ponto de entrada
```

## 🔗 Integração com Banco de Dados

Esta API utiliza o pacote compartilhado `@nexa-oper/db` para acesso ao banco de dados:

```typescript
import { PrismaClient } from '@nexa-oper/db';

const prisma = new PrismaClient();

// Exemplo de uso
const tests = await prisma.test.findMany();
```

### Serviço de Banco de Dados

A API inclui um `DbService` que gerencia a conexão com o banco:

```typescript
import { DbService } from './db/db.service';

@Injectable()
export class MeuServico {
  constructor(private dbService: DbService) {}
  
  async buscarTestes() {
    return await this.dbService.findAllTests();
  }
}
```

## 📝 Variáveis de Ambiente

Criar arquivo `.env` na raiz do projeto:

```env
DATABASE_URL="mysql://usuario:senha@localhost:3306/banco"
PORT=3001
NODE_ENV=development
```

## 🚀 Deploy

Para fazer deploy da aplicação:

1. Configure as variáveis de ambiente de produção
2. Execute `npm run build`
3. Inicie com `npm run start:prod`

## 📚 Documentação

- [NestJS Documentation](https://docs.nestjs.com)
- [Prisma Documentation](https://www.prisma.io/docs)
- [Monorepo Setup](./../../README.md)
