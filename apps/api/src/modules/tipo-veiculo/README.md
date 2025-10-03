# Módulo Tipos de Veículo

Este módulo gerencia todas as funcionalidades relacionadas aos tipos de veículo,
incluindo operações CRUD completas e sincronização para clientes mobile.

## 📁 Estrutura de Arquivos

```bash
tipo-veiculo/
├── constants/
│   ├── tipo-veiculo.constants.ts             # Constantes do módulo
│   └── index.ts                               # Exportações de constantes
├── controllers/
│   ├── tipo-veiculo.controller.ts            # Controller CRUD (Web)
│   ├── tipo-veiculo-sync.controller.ts       # Controller de sincronização (Mobile)
│   └── index.ts                               # Exportações de controllers
├── services/
│   ├── tipo-veiculo.service.ts               # Serviço com regras de negócio
│   └── index.ts                               # Exportações de serviços
├── dto/
│   ├── create-tipo-veiculo.dto.ts            # DTO para criação
│   ├── update-tipo-veiculo.dto.ts            # DTO para atualização
│   ├── tipo-veiculo-response.dto.ts          # DTO de resposta individual
│   ├── tipo-veiculo-list-response.dto.ts     # DTO de resposta paginada
│   ├── tipo-veiculo-query.dto.ts             # DTO de parâmetros de consulta
│   ├── tipo-veiculo-sync.dto.ts              # DTO para sincronização mobile
│   └── index.ts                               # Exportações de DTOs
├── tipo-veiculo.module.ts                     # Módulo principal
└── README.md                                  # Esta documentação
```

## 🎯 Controllers

### TipoVeiculoController (CRUD - Web)

**Rota base:** `/api/tipo-veiculo`

Endpoints principais:

- `GET /api/tipo-veiculo` — Lista tipos de veículo com filtros e paginação.
- `GET /api/tipo-veiculo/count` — Retorna quantidade de tipos de veículo ativos.
- `POST /api/tipo-veiculo` — Cria novo tipo de veículo.
- `GET /api/tipo-veiculo/:id` — Busca tipo de veículo específico.
- `PUT /api/tipo-veiculo/:id` — Atualiza tipo de veículo existente.
- `DELETE /api/tipo-veiculo/:id` — Remove tipo de veículo (soft delete).

### TipoVeiculoSyncController (Mobile - Sync)

**Rota base:** `/api/tipo-veiculo/sync`

Endpoints de sincronização:

- `GET /api/tipo-veiculo/sync` — Sincroniza todos os tipos de veículo ativos.

## 🔧 Funcionalidades

### CRUD Completo

- **Criação**: Validação de nome único e campos obrigatórios
- **Listagem**: Paginação, ordenação e busca textual por nome
- **Atualização**: Validação de duplicidade e campos opcionais
- **Exclusão**: Soft delete com verificação de uso em veículos

### Sincronização Mobile

- **Dados completos**: Sem paginação para facilitar sincronização offline
- **Auditoria**: Campos de criação, atualização e exclusão incluídos
- **Performance**: Ordenação otimizada (updatedAt desc)

### Validações

- **Nome único**: Não permite tipos com mesmo nome
- **Integridade**: Impede exclusão de tipos em uso por veículos
- **Campos obrigatórios**: Nome é obrigatório
- **Tamanhos**: Nome entre 2 e 255 caracteres

## 🚀 Uso

### Web (CRUD)

```bash
# Listar tipos de veículo com filtro
GET /api/tipo-veiculo?page=1&limit=10&search=Caminhão

# Criar novo tipo de veículo
POST /api/tipo-veiculo
{
  "nome": "Caminhão Basculante"
}

# Buscar tipo de veículo específico
GET /api/tipo-veiculo/1

# Atualizar tipo de veículo
PUT /api/tipo-veiculo/1
{
  "nome": "Caminhão Basculante Grande"
}

# Remover tipo de veículo
DELETE /api/tipo-veiculo/1
```

### Mobile (Sync)

```bash
# Sincronizar todos os tipos de veículo
GET /api/tipo-veiculo/sync
```

## 🔒 Segurança

- **Autenticação**: Todas as rotas requerem JWT válido
- **Autorização**: Bearer token no header Authorization
- **Validação**: DTOs com class-validator para entrada de dados
- **Auditoria**: Logs estruturados para todas as operações

## 📊 Estrutura de Dados

### TipoVeiculoSyncDto (Mobile)

```typescript
{
  id: number;
  nome: string;
  createdAt: Date;
  createdBy: string;
  updatedAt?: Date;
  updatedBy?: string;
  deletedAt?: Date;
  deletedBy?: string;
}
```

### TipoVeiculoResponseDto (Web)

```typescript
{
  id: number;
  nome: string;
  createdAt: Date;
  createdBy: string;
  updatedAt?: Date;
  updatedBy?: string;
  deletedAt?: Date;
  deletedBy?: string;
}
```

## 📝 Próximos Passos

1. Implementar cache Redis para listas de tipos de veículo.
2. Adicionar testes unitários e de integração específicos.
3. Implementar versionamento de API se necessário.
4. Adicionar métricas de uso e performance.
