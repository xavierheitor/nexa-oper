# Web App - Nexa Oper

Aplicação web frontend da Nexa Oper, construída com Next.js 15.

## 🚀 Tecnologias

- **Next.js 15** - Framework React para aplicações web
- **TypeScript** - Linguagem de programação tipada
- **React** - Biblioteca para interfaces de usuário
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
npm run dev          # Servidor de desenvolvimento
npm run build        # Build de produção
npm run start        # Iniciar servidor de produção
npm run lint         # Executar ESLint
```

## 🌐 Estrutura da Aplicação

```bash
src/
├── app/                    # App Router (Next.js 13+)
│   ├── layout.tsx         # Layout principal
│   ├── page.tsx           # Página inicial
│   ├── globals.css        # Estilos globais
│   └── favicon.ico        # Ícone da aplicação
├── components/             # Componentes React reutilizáveis
├── lib/                    # Utilitários e configurações
└── types/                  # Definições de tipos TypeScript
```

## 🔗 Integração com Banco de Dados

Esta aplicação utiliza o pacote compartilhado `@nexa-oper/db` para acesso ao banco de dados:

```typescript
import { db } from '@nexa-oper/db';

// Exemplo de uso em Server Components
const users = await db.prisma.user.findMany();
```

## 📝 Variáveis de Ambiente

Criar arquivo `.env.local` na pasta da aplicação:

```env
DATABASE_URL="mysql://usuario:senha@localhost:3306/banco"
NEXT_PUBLIC_API_URL="http://localhost:3001"
```

## 🚀 Desenvolvimento

1. **Iniciar servidor de desenvolvimento:**

   ```bash
   npm run dev
   ```

2. **Abrir no navegador:** [http://localhost:3000](http://localhost:3000)

3. **Editar arquivos:**
   - `src/app/page.tsx` - Página inicial
   - `src/app/layout.tsx` - Layout principal
   - `src/components/` - Componentes

## 🏗️ Build e Deploy

```bash
# Build de produção
npm run build

# Iniciar servidor de produção
npm run start

# Deploy no Vercel
vercel --prod
```

## 📚 Documentação

- [Next.js Documentation](https://nextjs.org/docs)
- [React Documentation](https://react.dev)
- [Prisma Documentation](https://www.prisma.io/docs)
- [Monorepo Setup](./../../README.md)

## 🔄 Hot Reload

A aplicação possui hot reload automático. Qualquer alteração nos arquivos será refletida
imediatamente no navegador durante o desenvolvimento.
