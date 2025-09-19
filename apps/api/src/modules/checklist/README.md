# Módulo Checklist

Este módulo gerencia todas as funcionalidades relacionadas aos checklists de segurança,
incluindo operações CRUD completas e sincronização para clientes mobile.

## 📁 Estrutura de Arquivos

```bash
checklist/
├── constants/
│   ├── checklist.constants.ts        # Constantes centralizadas do módulo
│   └── index.ts                      # Exportações de constantes
├── controllers/
│   └── index.ts                      # Exportações de controllers
├── dto/
│   ├── create-checklist.dto.ts       # DTO para criação
│   ├── update-checklist.dto.ts       # DTO para atualização
│   ├── checklist-response.dto.ts     # DTO para respostas individuais
│   ├── checklist-list-response.dto.ts# DTO para listas paginadas
│   ├── checklist-query.dto.ts        # DTO para parâmetros de consulta
│   ├── pagination-meta.dto.ts        # DTO para metadados de paginação
│   ├── checklist-pergunta-sync.dto.ts            # DTO para sincronização de perguntas
│   ├── checklist-pergunta-relacao-sync.dto.ts    # DTO para relações Checklist-Perguntas
│   ├── checklist-opcao-resposta-sync.dto.ts      # DTO para opções de resposta
│   ├── checklist-opcao-resposta-relacao-sync.dto.ts # DTO para relações Checklist-Opções
│   ├── checklist-tipo-veiculo-relacao-sync.dto.ts   # DTO para relações Checklist-TipoVeículo
│   ├── checklist-tipo-equipe-relacao-sync.dto.ts    # DTO para relações Checklist-TipoEquipe
│   └── index.ts                      # Exportações de DTOs
├── checklist.controller.ts           # Controller CRUD (Web)
├── checklist-sync.controller.ts      # Controller de sincronização (Mobile)
├── checklist.service.ts              # Serviço com lógica de negócio
├── checklist.module.ts               # Módulo principal
└── README.md                         # Esta documentação
```

## 🎯 Controllers

### ChecklistController (CRUD - Web)

**Rota base:** `/api/checklist`

Endpoints para operações CRUD tradicionais com paginação e filtros:

- `GET /api/checklist/modelos` - Lista checklists (paginado, busca, filtro por tipo)
- `POST /api/checklist/modelos` - Cria novo checklist
- `GET /api/checklist/modelos/:id` - Busca checklist específico
- `PUT /api/checklist/modelos/:id` - Atualiza checklist existente
- `DELETE /api/checklist/modelos/:id` - Remove checklist (soft delete)
- `GET /api/checklist/modelos/count` - Conta total de checklists ativos

### ChecklistSyncController (Sincronização - Mobile)

**Rota base:** `/api/checklist/sync`

Endpoints para sincronização completa sem paginação:

- `GET /api/checklist/sync/modelos` - Sincronizar checklists
- `GET /api/checklist/sync/perguntas` - Sincronizar perguntas
- `GET /api/checklist/sync/perguntas/relacoes` - Sincronizar relações Checklist-Perguntas
- `GET /api/checklist/sync/opcoes-resposta` - Sincronizar opções de resposta
- `GET /api/checklist/sync/opcoes-resposta/relacoes` - Sincronizar relações Checklist-Opções
- `GET /api/checklist/sync/tipos-veiculo/relacoes` - Sincronizar relações Checklist-TipoVeículo
- `GET /api/checklist/sync/tipos-equipe/relacoes` - Sincronizar relações Checklist-TipoEquipe

## 🔧 Serviço

### ChecklistService

Serviço centralizado com toda a lógica de negócio:

- **CRUD:** create, findAll, findOne, update, remove, count
- **Sync:** findAllForSync, findAllPerguntasForSync, findAllOpcoesForSync, findAllPerguntaRelacoesForSync,
  findAllOpcaoRelacoesForSync, findAllTipoVeiculoRelacoesForSync, findAllTipoEquipeRelacoesForSync
- **Validações:** IDs, paginação, duplicatas, existência do tipo de checklist
- **Auditoria:** Criação, atualização, exclusão lógica
- **Logging:** Estruturado com contexto detalhado

## 📋 DTOs

### DTOs Principais

- **CreateChecklistDto:** Validação para criação de checklists
- **UpdateChecklistDto:** Validação para atualização (campos opcionais)
- **ChecklistResponseDto:** Estrutura de resposta individual
- **ChecklistListResponseDto:** Estrutura de resposta paginada
- **ChecklistQueryDto:** Parâmetros de consulta (página, limite, busca, tipo)
- **PaginationMetaDto:** Metadados de paginação

### DTOs de Sincronização

- **ChecklistPerguntaSyncDto:** Sincronização de perguntas
- **ChecklistPerguntaRelacaoSyncDto:** Sincronização de relações Checklist-Perguntas
- **ChecklistOpcaoRespostaSyncDto:** Sincronização de opções de resposta (com flag de pendência)
- **ChecklistOpcaoRespostaRelacaoSyncDto:** Sincronização de relações Checklist-Opções
- **ChecklistTipoVeiculoRelacaoSyncDto:** Sincronização de relações Checklist-TipoVeículo
- **ChecklistTipoEquipeRelacaoSyncDto:** Sincronização de relações Checklist-TipoEquipe

## ⚙️ Constantes

Arquivo `constants/checklist.constants.ts` centraliza:

- **PAGINATION_CONFIG:** Limites e configurações de paginação
- **VALIDATION_CONFIG:** Tamanhos mínimos/máximos de campos
- **AUDIT_CONFIG:** Configurações de auditoria
- **ERROR_MESSAGES:** Mensagens de erro padronizadas
- **ORDER_CONFIG:** Configurações de ordenação para consultas e sincronização

## 🔐 Segurança

- **Autenticação JWT:** Todos os endpoints requerem token válido
- **Validação de Dados:** DTOs com class-validator
- **Soft Delete:** Preservação de dados para auditoria
- **Logging:** Rastreamento de operações críticas

## 📊 Performance

- **Paginação:** Listas grandes divididas em páginas
- **Índices:** Consultas otimizadas no banco
- **Paralelização:** Consultas simultâneas quando possível
- **Cache Ready:** Estrutura preparada para futura implementação de cache

## 🚀 Uso

### Web (CRUD)

```bash
# Listar com paginação e filtro
GET /api/checklist/modelos?page=1&limit=10&search=partida&tipoChecklistId=3

# Criar novo checklist
POST /api/checklist/modelos
{
  "nome": "Checklist Pré-Partida",
  "tipoChecklistId": 3
}

# Buscar específico
GET /api/checklist/modelos/1
```

### Mobile (Sync)

```bash
# Sincronizar todos os dados relevantes
GET /api/checklist/sync/modelos
GET /api/checklist/sync/perguntas
GET /api/checklist/sync/perguntas/relacoes
GET /api/checklist/sync/opcoes-resposta
GET /api/checklist/sync/opcoes-resposta/relacoes
GET /api/checklist/sync/tipos-veiculo/relacoes
GET /api/checklist/sync/tipos-equipe/relacoes
```

## 📝 Próximos Passos

1. **Implementar cache Redis** para acelerar consultas frequentes
2. **Adicionar testes unitários** e de integração para o serviço
3. **Implementar rate limiting** para endpoints sensíveis
4. **Adicionar métricas** de utilização e performance
5. **Mapear eventos** para notificar integrações externas
