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

### Módulos Destacados

- **Escalas** – `/modules/escala` concentra o cadastro de padrões de escala (espanhola, 4x2 etc.), atribuição de eletricistas e geração de agenda automática integrada à abertura de turnos. Consulte o [README do módulo](./src/modules/escala/README.md) para exemplos.

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

Criar arquivo `.env` na raiz do projeto baseado no `.env.example`:

```env
DATABASE_URL="mysql://usuario:senha@localhost:3306/banco"
PORT=3001
NODE_ENV=development
JWT_SECRET="sua-chave-secreta-com-pelo-menos-32-caracteres"
```

### 🔐 Configurando JWT_SECRET

A variável `JWT_SECRET` é **obrigatória** e deve ser configurada antes de iniciar a aplicação.

**Requisitos:**
- Mínimo de 32 caracteres
- Chave única e aleatória
- **NUNCA** use valores simples como "secret"

**Gerar uma chave segura:**

```bash
# Opção 1: Usando Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"

# Opção 2: Usando OpenSSL (se disponível)
openssl rand -base64 32

# Opção 3: Usando Python
python3 -c "import secrets; print(secrets.token_urlsafe(32))"
```

**Exemplo:**
```bash
# Execute o comando acima e copie o resultado
# Depois adicione no seu .env:
JWT_SECRET="/n2l+YTSOweoWU0lc3kaxli+AS64FnMYcf393VXAJ9E="
```

## ✅ Qualidade e Padrões

### Linters e Formatação
- ESLint (regras fortalecidas): no-console (usar Logger), import/order, complexity, max-lines-per-file
- Prettier: formatação consistente

Comandos:
```
npm run lint        # Lint estrito (falha em warnings)
npm run lint:fix    # Corrige problemas possíveis
npm run format      # Formata arquivos suportados
```

### Commits e Pre-commit
- Commitlint (conventional commits)
- lint-staged + Husky (executa eslint/prettier nos arquivos staged)

Scripts úteis:
```
npm run prepare     # instala hooks do husky
```

### Configuração por Ambiente
`@nestjs/config` com validação Joi (arquivo `src/config/validation.ts`).
Variáveis:
- `JWT_SECRET` (mín. 32 chars, diferente de "secret")
- `DATABASE_URL` (obrigatória)
- `CORS_ORIGINS` (opcional)
- `RATE_LIMIT_*` (opcionais com padrão seguro)

### Observabilidade
- Logging padronizado (`StandardLogger`) + sanitização (`sanitizeHeaders`, `sanitizeData`)
- Interceptores globais: erros e operações

⚠️ **IMPORTANTE:**
- Cada ambiente (desenvolvimento, staging, produção) deve ter sua própria chave única
- **NUNCA** commite o arquivo `.env` no repositório
- Use diferentes chaves para desenvolvimento e produção

## 🚀 Deploy

Para fazer deploy da aplicação:

1. Configure as variáveis de ambiente de produção
2. Execute `npm run build`
3. Inicie com `npm run start:prod`

## 📚 Documentação

- [NestJS Documentation](https://docs.nestjs.com)
- [Prisma Documentation](https://www.prisma.io/docs)
- [Monorepo Setup](./../../README.md)
