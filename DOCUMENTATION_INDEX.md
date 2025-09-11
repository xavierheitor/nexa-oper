# 📚 Índice da Documentação - Nexa Oper

## 🎯 Visão Geral

Este é o índice completo de toda a documentação do projeto Nexa Oper. Use este guia para navegar
rapidamente para a informação que você precisa.

## 📖 Documentação Principal

### **🚀 Início Rápido**

- **[QUICKSTART.md](./QUICKSTART.md)** - Guia para começar rapidamente
  - Configuração inicial em 5 minutos
  - Comandos essenciais
  - Primeiro projeto funcionando

### **⚙️ Configuração Completa**

- **[SETUP_GUIDE.md](./SETUP_GUIDE.md)** - Guia completo de configuração
  - Arquitetura do projeto
  - Configuração detalhada do ambiente
  - Variáveis de ambiente
  - Troubleshooting

### **📦 Criação de Módulos**

- **[MODULE_CREATION_GUIDE.md](./MODULE_CREATION_GUIDE.md)** - Manual passo a passo
  - Exemplo completo: Módulo "Pergunta APR"
  - Sequência correta de implementação
  - Schema → Repository → Service → Actions → Form → Page
  - Checklist de verificação

### **🔗 Sistema de Includes**

- **[INCLUDES_GUIDE.md](./INCLUDES_GUIDE.md)** - Sistema de relacionamentos dinâmicos
  - Como usar includes no frontend
  - Exemplos práticos
  - Otimização de performance
  - Includes aninhados

### **🏆 Melhores Práticas**

- **[DEVELOPMENT_BEST_PRACTICES.md](./DEVELOPMENT_BEST_PRACTICES.md)** - Padrões de desenvolvimento
  - Clean Architecture
  - Padrões de código
  - Qualidade e testes
  - Performance e segurança

### **📜 Scripts Disponíveis**

- **[SCRIPTS.md](./SCRIPTS.md)** - Lista completa de comandos
  - Scripts de desenvolvimento
  - Scripts de build
  - Scripts de banco de dados
  - Scripts de qualidade

## 🏗️ Arquitetura e Padrões

### **Estrutura do Projeto**

```bash
nexa-oper/
├── 📁 apps/
│   ├── 📁 api/              # Backend NestJS
│   └── 📁 web/              # Frontend Next.js
│       ├── 📁 src/app/      # App Router (páginas)
│       ├── 📁 src/lib/      # Lógica de negócio
│       │   ├── 📁 actions/  # Server Actions
│       │   ├── 📁 services/ # Lógica de negócio
│       │   ├── 📁 repositories/ # Acesso a dados
│       │   ├── 📁 schemas/  # Validação Zod
│       │   └── 📁 hooks/    # Custom Hooks
│       └── 📁 src/ui/       # Componentes UI
├── 📁 packages/
│   └── 📁 db/               # Prisma ORM
└── 📄 Documentação          # Guias e manuais
```

### **Fluxo de Dados**

```bash
Interface → Hooks → Actions → Services → Repositories → Prisma → Database
```

### **Padrões Implementados**

- **Repository Pattern** - Abstração de acesso a dados
- **Service Pattern** - Lógica de negócio centralizada
- **Server Actions** - Interface frontend/backend
- **Container Pattern** - Injeção de dependência
- **Schema Validation** - Validação com Zod

## 📋 Guias por Funcionalidade

### **🔐 Autenticação**

- Configuração NextAuth.js
- Proteção de rotas
- Middleware de autenticação
- Auditoria automática

### **🗄️ Banco de Dados**

- Modelos Prisma
- Migrações
- Seeds
- Relacionamentos

### **🎨 Interface**

- Ant Design components
- Formulários padronizados
- Tabelas com ações
- Modais responsivos

### **🔍 Busca e Filtros**

- Sistema de filtros
- Paginação
- Ordenação
- Busca textual

### **📊 Performance**

- Includes dinâmicos
- Cache com SWR
- Otimização de queries
- Lazy loading

## 🛠️ Ferramentas e Tecnologias

### **Frontend**

- **Next.js 15** - Framework React
- **TypeScript** - Tipagem estática
- **Ant Design** - Biblioteca UI
- **SWR** - Cache e fetching
- **Zod** - Validação de schemas

### **Backend**

- **NestJS** - Framework Node.js
- **Prisma** - ORM
- **PostgreSQL** - Banco de dados
- **NextAuth.js** - Autenticação

### **Desenvolvimento**

- **Turbo** - Monorepo
- **ESLint** - Linting
- **Prettier** - Formatação
- **Jest** - Testes
- **Playwright** - E2E

## 📚 Documentação por Módulo

### **Módulos Implementados**

#### **Contrato**

- **Localização**: `apps/web/src/lib/*/contrato/`
- **Funcionalidades**: CRUD completo, validação, auditoria
- **Documentação**: JSDoc completa em todas as actions

#### **Veículo**

- **Localização**: `apps/web/src/lib/*/veiculo/`
- **Funcionalidades**: CRUD, relacionamentos, validação de placa
- **Documentação**: JSDoc completa, exemplos de uso

#### **Tipo Veículo**

- **Localização**: `apps/web/src/lib/*/tipoVeiculo/`
- **Funcionalidades**: CRUD, relacionamento com veículos
- **Documentação**: JSDoc completa, padrões seguidos

### **Exemplo de Novo Módulo**

#### **Pergunta APR** (Exemplo no guia)

- **Modelo Prisma**: `packages/db/prisma/models/pergunta_apr.prisma`
- **Schema**: `apps/web/src/lib/schemas/perguntaAprSchema.ts`
- **Repository**: `apps/web/src/lib/repositories/PerguntaAprRepository.ts`
- **Service**: `apps/web/src/lib/services/PerguntaAprService.ts`
- **Actions**: `apps/web/src/lib/actions/perguntaApr/`
- **Interface**: `apps/web/src/app/dashboard/pergunta-apr/`

## 🎓 Tutoriais e Exemplos

### **Para Iniciantes**

1. **Leia o QUICKSTART.md** - Configuração básica
2. **Explore um módulo existente** - Entenda os padrões
3. **Siga o MODULE_CREATION_GUIDE.md** - Crie seu primeiro módulo

### **Para Desenvolvedores Experientes**

1. **DEVELOPMENT_BEST_PRACTICES.md** - Padrões avançados
2. **INCLUDES_GUIDE.md** - Otimizações de performance
3. **Contribua com novos padrões** - Melhore a arquitetura

### **Para DevOps**

1. **SETUP_GUIDE.md** - Configuração de ambiente
2. **SCRIPTS.md** - Automação e deploy
3. **Monitoramento** - Logs e métricas

## 🔄 Fluxo de Desenvolvimento

### **1. Planejamento**

- Definir requisitos
- Escolher padrões
- Planejar arquitetura

### **2. Implementação**

- Seguir MODULE_CREATION_GUIDE.md
- Aplicar DEVELOPMENT_BEST_PRACTICES.md
- Documentar com JSDoc

### **3. Qualidade**

- Executar testes
- Verificar lint
- Revisar código

### **4. Deploy**

- Build de produção
- Configurar ambiente
- Monitorar aplicação

## 📞 Suporte e Contribuição

### **Encontrou um Bug?**

1. Verifique os logs
2. Consulte TROUBLESHOOTING
3. Abra uma issue

### **Quer Contribuir?**

1. Leia DEVELOPMENT_BEST_PRACTICES.md
2. Siga os padrões estabelecidos
3. Documente suas mudanças
4. Abra um pull request

### **Precisa de Ajuda?**

1. Consulte a documentação relevante
2. Verifique os exemplos existentes
3. Entre em contato com a equipe

## 🗺️ Roadmap da Documentação

### **Próximas Adições**

- [ ] Guia de Testes Unitários
- [ ] Guia de Deploy em Produção
- [ ] Documentação de APIs
- [ ] Guia de Monitoramento
- [ ] Tutorial de Contribuição

### **Melhorias Contínuas**

- [ ] Atualizar exemplos
- [ ] Adicionar mais casos de uso
- [ ] Melhorar explicações
- [ ] Criar vídeos tutoriais

---

## 🎯 Como Usar Este Índice

### **Sou Novo no Projeto**

1. **QUICKSTART.md** → **SETUP_GUIDE.md** → **MODULE_CREATION_GUIDE.md**

### **Quero Criar um Novo Módulo**

1. **MODULE_CREATION_GUIDE.md** → **DEVELOPMENT_BEST_PRACTICES.md**

### **Preciso Otimizar Performance**

1. **INCLUDES_GUIDE.md** → **DEVELOPMENT_BEST_PRACTICES.md**

### **Vou Fazer Deploy**

1. **SETUP_GUIDE.md** → **SCRIPTS.md**

### **Quero Entender a Arquitetura**

1. **SETUP_GUIDE.md** → **DEVELOPMENT_BEST_PRACTICES.md**

---

***📚 Documentação completa e sempre atualizada para garantir o sucesso do seu desenvolvimento! ✨***
