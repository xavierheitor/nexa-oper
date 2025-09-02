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

### 2. Configuração do Banco de Dados

Criar arquivo `.env` na raiz do projeto:

```env
DATABASE_URL="mysql://usuario:senha@localhost:3306/nexa_oper"
NODE_ENV=development
```

### 3. Configuração das Aplicações

Criar arquivo `.env.local` em `apps/web/`:

```env
NEXT_PUBLIC_API_URL="http://localhost:3001"
```

Criar arquivo `.env` em `apps/api/`:

```env
DATABASE_URL="mysql://usuario:senha@localhost:3306/nexa_oper"
PORT=3001
NODE_ENV=development
```

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

```bash
# Para uma aplicação específica
npm install <pacote> --workspace=apps/web
npm install <pacote> --workspace=apps/api

# Para um pacote específico
npm install <pacote> --workspace=packages/db

# Para o monorepo como um todo
npm install <pacote> -w .
```

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
