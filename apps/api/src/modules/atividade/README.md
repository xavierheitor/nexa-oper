# Módulo Atividade

Este módulo gerencia todas as funcionalidades relacionadas aos tipos de atividade da operação, incluindo operações CRUD e sincronização para clientes mobile.

## 📁 Estrutura de Arquivos

```bash
atividade/
├── constants/
│   ├── atividade.constants.ts      # Constantes centralizadas
│   └── index.ts                    # Exportações de constantes
├── controllers/
│   ├── tipo-atividade.controller.ts        # Controller CRUD (Web)
│   ├── tipo-atividade-sync.controller.ts   # Controller de sincronização (Mobile)
│   └── index.ts                            # Exportações de controllers
├── services/
│   ├── tipo-atividade.service.ts           # Regras de negócio de tipos de atividade
│   └── index.ts                            # Exportações de serviços
├── dto/
│   ├── create-tipo-atividade.dto.ts        # DTO para criação
│   ├── update-tipo-atividade.dto.ts        # DTO para atualização
│   ├── tipo-atividade-response.dto.ts      # DTO para respostas
│   ├── tipo-atividade-list-response.dto.ts # DTO para listas paginadas
│   ├── tipo-atividade-query.dto.ts         # DTO para parâmetros de consulta
│   ├── tipo-atividade-sync.dto.ts          # DTO para sincronização
│   └── index.ts                            # Exportações de DTOs
├── atividade.module.ts              # Módulo principal
├── index.ts                         # Exportações principais
└── README.md                        # Esta documentação
```

## 🎯 Controllers

### TipoAtividadeController (CRUD - Web)

**Rota base:** `/api/atividade/tipos`

Endpoints para operações CRUD tradicionais com paginação:

- `GET /api/atividade/tipos` - Lista tipos de atividade (paginado)
- `POST /api/atividade/tipos` - Cria novo tipo de atividade
- `GET /api/atividade/tipos/:id` - Busca tipo de atividade por ID
- `PATCH /api/atividade/tipos/:id` - Atualiza tipo de atividade
- `DELETE /api/atividade/tipos/:id` - Remove tipo de atividade

### TipoAtividadeSyncController (Sincronização - Mobile)

**Rota base:** `/api/atividade/sync`

Endpoints para sincronização com clientes mobile:

- `GET /api/atividade/sync/tipos` - Sincroniza tipos de atividade

## 🔧 Services

### TipoAtividadeService

Serviço principal que implementa toda a lógica de negócio:

- **CRUD completo** com validações
- **Integração com permissões de contrato**
- **Auditoria automática** em todas as operações
- **Validação de duplicidade** de nomes
- **Sincronização** para mobile
- **Logging estruturado** de operações

## 📊 DTOs

### DTOs de CRUD

- `CreateTipoAtividadeDto` - Dados para criação
- `UpdateTipoAtividadeDto` - Dados para atualização
- `TipoAtividadeResponseDto` - Resposta individual
- `TipoAtividadeListResponseDto` - Resposta de listagem
- `TipoAtividadeQueryDto` - Parâmetros de consulta

### DTOs de Sincronização

- `TipoAtividadeSyncDto` - Dados para sincronização mobile

## 🔒 Segurança

- **Autenticação JWT** obrigatória em todas as rotas
- **Permissões de contrato** para controle de acesso
- **Validação de entrada** via class-validator
- **Sanitização de dados** automática

## 📈 Performance

- **Paginação** para listagens grandes
- **Índices otimizados** no banco de dados
- **Ordenação eficiente** (criado em desc)
- **Filtros de busca** para facilitar localização

## 🚀 Uso

### Exemplo de Listagem

```bash
curl -H "Authorization: Bearer <token>" \
  "http://localhost:3001/api/atividade/tipos?page=1&limit=10&search=Soldagem"
```

### Exemplo de Criação

```bash
curl -X POST \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"nome": "Soldagem Industrial"}' \
  "http://localhost:3001/api/atividade/tipos"
```

### Exemplo de Sincronização

```bash
curl -H "Authorization: Bearer <token>" \
  "http://localhost:3001/api/atividade/sync/tipos"
```

## 🔄 Integração

O módulo está integrado com:

- **DatabaseModule** - Acesso ao Prisma
- **AuthModule** - Autenticação e permissões
- **CommonModule** - Utilitários compartilhados

## 📝 Logs

O módulo gera logs estruturados para:

- Operações CRUD
- Sincronizações
- Erros e exceções
- Validações de negócio
