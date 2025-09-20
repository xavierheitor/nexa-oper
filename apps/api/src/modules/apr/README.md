# Módulo APR (Análise Preliminar de Risco)

Este módulo gerencia todas as funcionalidades relacionadas aos modelos de APR, incluindo operações
CRUD e sincronização para clientes mobile.

## 📁 Estrutura de Arquivos

```bash
apr/
├── constants/
│   ├── apr.constants.ts         # Constantes centralizadas
│   └── index.ts                 # Exportações de constantes
├── controllers/
│   ├── apr.controller.ts        # Controller CRUD (Web)
│   ├── apr-sync.controller.ts   # Controller de sincronização (Mobile)
│   └── index.ts                 # Exportações de controllers
├── services/
│   ├── apr.service.ts           # Regras de negócio de APR
│   └── index.ts                 # Exportações de serviços
├── dto/
│   ├── create-apr.dto.ts        # DTO para criação
│   ├── update-apr.dto.ts        # DTO para atualização
│   ├── apr-response.dto.ts      # DTO para respostas
│   ├── apr-list-response.dto.ts # DTO para listas paginadas
│   ├── apr-query.dto.ts         # DTO para parâmetros de consulta
│   ├── apr-pergunta-sync.dto.ts # DTO para sincronização de perguntas
│   ├── apr-pergunta-relacao-sync.dto.ts # DTO para relações APR-Perguntas
│   ├── apr-opcao-resposta-sync.dto.ts   # DTO para opções de resposta
│   ├── apr-opcao-resposta-relacao-sync.dto.ts # DTO para relações APR-Opções
│   ├── apr-tipo-atividade-relacao-sync.dto.ts # DTO para relações APR-TipoAtividade
│   └── index.ts                 # Exportações de DTOs
├── apr.module.ts                # Módulo principal
└── README.md                    # Esta documentação
```

## 🎯 Controllers

### AprController (CRUD - Web)

**Rota base:** `/api/apr`

Endpoints para operações CRUD tradicionais com paginação:

- `GET /api/apr/modelos` - Lista modelos APR (paginado)
- `POST /api/apr/modelos` - Cria novo modelo APR
- `GET /api/apr/modelos/:id` - Busca modelo específico
- `PUT /api/apr/modelos/:id` - Atualiza modelo existente
- `DELETE /api/apr/modelos/:id` - Remove modelo (soft delete)
- `GET /api/apr/modelos/count` - Conta total de modelos ativos

**Características:**

- ✅ Paginação eficiente
- ✅ Busca por nome
- ✅ Validação rigorosa
- ✅ Documentação Swagger completa
- ✅ Tratamento de erros padronizado

### AprSyncController (Sincronização - Mobile)

**Rota base:** `/api/apr/sync`

Endpoints para sincronização completa sem paginação:

- `GET /api/apr/sync/modelos` - Sincronizar modelos APR
- `GET /api/apr/sync/perguntas` - Sincronizar perguntas APR
- `GET /api/apr/sync/perguntas/relacoes` - Sincronizar relações APR-Perguntas
- `GET /api/apr/sync/opcoes-resposta` - Sincronizar opções de resposta
- `GET /api/apr/sync/opcoes-resposta/relacoes` - Sincronizar relações APR-Opções
- `GET /api/apr/sync/tipos-atividade/relacoes` - Sincronizar relações APR-TipoAtividade

**Características:**

- ✅ Dados completos sem paginação
- ✅ Ordenação otimizada para mobile
- ✅ Campos de auditoria incluídos
- ✅ Documentação Swagger completa
- ✅ Performance otimizada para sincronização

## 🔧 Serviços

### AprService

Serviço centralizado com toda a lógica de negócio:

- **CRUD Operations:** create, findAll, findOne, update, remove, count
- **Sync Operations:** findAllForSync, findAllPerguntasForSync, etc.
- **Validações:** IDs, paginação, duplicatas
- **Auditoria:** Criação, atualização, exclusão lógica
- **Logging:** Estruturado com contexto detalhado

## 📋 DTOs

### DTOs Principais

- **CreateAprDto:** Validação para criação de modelos
- **UpdateAprDto:** Validação para atualização (campos opcionais)
- **AprResponseDto:** Estrutura de resposta individual
- **AprListResponseDto:** Estrutura de resposta paginada
- **AprQueryDto:** Parâmetros de consulta (página, limite, busca)
- **PaginationMetaDto:** Metadados de paginação (importado de `@common/dto/pagination-meta.dto`)

### DTOs de Sincronização

- **AprPerguntaSyncDto:** Sincronização de perguntas
- **AprPerguntaRelacaoSyncDto:** Sincronização de relações APR-Perguntas
- **AprOpcaoRespostaSyncDto:** Sincronização de opções de resposta
- **AprOpcaoRespostaRelacaoSyncDto:** Sincronização de relações APR-Opções
- **AprTipoAtividadeRelacaoSyncDto:** Sincronização de relações APR-TipoAtividade

## ⚙️ Constantes

Arquivo `constants/apr.constants.ts` centraliza:

- **PAGINATION_CONFIG:** Limites e configurações de paginação
- **VALIDATION_CONFIG:** Tamanhos mínimos/máximos de campos
- **AUDIT_CONFIG:** Configurações de auditoria
- **ERROR_MESSAGES:** Mensagens de erro padronizadas
- **ORDER_CONFIG:** Configurações de ordenação para consultas

## 🔐 Segurança

- **Autenticação JWT:** Todos os endpoints requerem token válido
- **Validação de Dados:** DTOs com class-validator
- **Soft Delete:** Preservação de dados para auditoria
- **Logging:** Rastreamento de operações críticas

## 📊 Performance

- **Paginação:** Listas grandes divididas em páginas
- **Índices:** Consultas otimizadas no banco
- **Cache:** Preparado para implementação futura
- **Paralelização:** Consultas simultâneas quando possível

## 🚀 Uso

### Web (CRUD)

```typescript
// Listar com paginação
GET /api/apr/modelos?page=1&limit=10&search=soldagem

// Criar novo modelo
POST /api/apr/modelos
{
  "nome": "APR Soldagem Industrial"
}

// Buscar específico
GET /api/apr/modelos/1
```

### Mobile (Sync)

```bash
# Sincronizar todos os dados
GET /api/apr/sync/modelos
GET /api/apr/sync/perguntas
GET /api/apr/sync/perguntas/relacoes
GET /api/apr/sync/opcoes-resposta
GET /api/apr/sync/opcoes-resposta/relacoes
GET /api/apr/sync/tipos-atividade/relacoes
```

## 📝 Próximos Passos

1. **Implementar cache Redis** para consultas frequentes
2. **Adicionar testes unitários** e de integração
3. **Implementar rate limiting** para endpoints públicos
4. **Adicionar métricas** de performance
5. **Implementar webhooks** para notificações de mudanças
