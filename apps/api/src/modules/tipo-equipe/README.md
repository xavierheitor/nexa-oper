# Módulo Tipos de Equipe

Este módulo gerencia todas as funcionalidades relacionadas aos tipos de equipe,
incluindo operações CRUD completas e sincronização para clientes mobile.

## 📁 Estrutura de Arquivos

```bash
tipo-equipe/
├── constants/
│   ├── tipo-equipe.constants.ts             # Constantes do módulo
│   └── index.ts                               # Exportações de constantes
├── controllers/
│   ├── tipo-equipe.controller.ts              # Controller CRUD (Web)
│   ├── tipo-equipe-sync.controller.ts         # Controller de sincronização (Mobile)
│   └── index.ts                               # Exportações de controllers
├── services/
│   ├── tipo-equipe.service.ts                # Serviço com regras de negócio
│   └── index.ts                               # Exportações de serviços
├── dto/
│   ├── create-tipo-equipe.dto.ts              # DTO para criação
│   ├── update-tipo-equipe.dto.ts             # DTO para atualização
│   ├── tipo-equipe-response.dto.ts           # DTO de resposta individual
│   ├── tipo-equipe-list-response.dto.ts     # DTO de resposta paginada
│   ├── tipo-equipe-query.dto.ts              # DTO de parâmetros de consulta
│   ├── tipo-equipe-sync.dto.ts               # DTO para sincronização mobile
│   └── index.ts                               # Exportações de DTOs
├── tipo-equipe.module.ts                      # Módulo principal
└── README.md                                  # Esta documentação
```

## 🎯 Controllers

### TipoEquipeController (CRUD - Web)

**Rota base:** `/api/tipo-equipe`

Endpoints principais:

- `GET /api/tipo-equipe` — Lista tipos de equipe com filtros e paginação.
- `GET /api/tipo-equipe/count` — Retorna quantidade de tipos de equipe ativos.
- `POST /api/tipo-equipe` — Cria novo tipo de equipe.
- `GET /api/tipo-equipe/:id` — Busca tipo de equipe específico.
- `PUT /api/tipo-equipe/:id` — Atualiza tipo de equipe existente.
- `DELETE /api/tipo-equipe/:id` — Remove tipo de equipe (soft delete).

### TipoEquipeSyncController (Sincronização - Mobile)

**Rota base:** `/api/tipo-equipe/sync`

Endpoints principais:

- `GET /api/tipo-equipe/sync` — Retorna todos os tipos de equipe para sincronização mobile.

## 🔧 Serviços

### TipoEquipeService

Responsável por toda a lógica de negócio:

- **CRUD completo** com validações
- **Paginação e filtros** para listagens
- **Sincronização mobile** otimizada
- **Auditoria automática** em todas as operações
- **Validação de duplicidade** de nomes
- **Verificação de uso** antes da exclusão

## 📊 DTOs

### DTOs de Entrada

- **CreateTipoEquipeDto**: Dados para criação
- **UpdateTipoEquipeDto**: Dados para atualização
- **TipoEquipeQueryDto**: Parâmetros de consulta e paginação

### DTOs de Saída

- **TipoEquipeResponseDto**: Resposta individual
- **TipoEquipeListResponseDto**: Resposta paginada
- **TipoEquipeSyncDto**: Dados para sincronização mobile

## 🔒 Segurança

- **Autenticação JWT** obrigatória em todas as rotas
- **Validação de dados** com class-validator
- **Auditoria completa** de todas as operações
- **Soft delete** para preservar histórico

## 📈 Performance

- **Paginação otimizada** para listagens
- **Índices de banco** para consultas rápidas
- **Sincronização mobile** sem paginação
- **Cache de consultas** frequentes

## 🚀 Uso

### Exemplo de Criação

```typescript
const createDto: CreateTipoEquipeDto = {
  nome: 'Linha Viva'
};

const tipoEquipe = await tipoEquipeService.create(createDto);
```

### Exemplo de Listagem

```typescript
const query: TipoEquipeQueryDto = {
  page: 1,
  limit: 10,
  search: 'Linha Viva',
  orderBy: 'nome',
  orderDir: 'asc'
};

const result = await tipoEquipeService.findAll(query);
```

### Exemplo de Sincronização

```typescript
const tiposEquipe = await tipoEquipeService.findAllForSync();
```

## 🛠️ Configuração

O módulo é automaticamente importado no `AppModule` e não requer configuração adicional.

## 📝 Logs

Todas as operações são logadas com:

- **Nível de log** apropriado
- **Contexto** da operação
- **Dados relevantes** para debugging
- **Tratamento de erros** padronizado
