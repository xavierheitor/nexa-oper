# Módulo Veículos

Este módulo concentra todas as funcionalidades relacionadas aos veículos,
incluindo operações CRUD completas, sincronização para clientes mobile e
integração com o sistema de permissões de contrato.

## 📁 Estrutura de Arquivos

```bash
veiculo/
├── constants/
│   ├── veiculo.constants.ts          # Constantes do módulo
│   └── index.ts                      # Exportações de constantes
├── controllers/
│   └── index.ts                      # Exportações de controllers
├── dto/
│   ├── create-veiculo.dto.ts         # DTO para criação
│   ├── update-veiculo.dto.ts         # DTO para atualização
│   ├── veiculo-response.dto.ts       # DTO de resposta individual
│   ├── veiculo-list-response.dto.ts  # DTO de resposta paginada
│   ├── veiculo-query.dto.ts          # DTO de parâmetros de consulta
│   ├── pagination-meta.dto.ts        # DTO de metadados de paginação
│   ├── veiculo-sync.dto.ts           # DTO para sincronização mobile
│   └── index.ts                      # Exportações de DTOs
├── veiculo.controller.ts             # Controller CRUD (Web)
├── veiculo-sync.controller.ts        # Controller de sincronização (Mobile)
├── veiculo.service.ts                # Serviço com regras de negócio
├── veiculo.module.ts                 # Módulo principal
└── README.md                         # Esta documentação
```

## 🎯 Controllers

### VeiculoController (CRUD - Web)

**Rota base:** `/api/veiculos`

Endpoints principais:

- `GET /api/veiculos` — Lista veículos com filtros e paginação, respeitando permissões de contrato.
- `GET /api/veiculos/count` — Retorna quantidade de veículos acessíveis.
- `POST /api/veiculos` — Cria novo veículo (valida permissão do contrato).
- `GET /api/veiculos/:id` — Busca veículo específico com validação de contrato.
- `PUT /api/veiculos/:id` — Atualiza veículo existente com checagem de permissão.
- `DELETE /api/veiculos/:id` — Soft delete do veículo, mantendo auditoria.

### VeiculoSyncController (Sincronização - Mobile)

**Rota base:** `/api/veiculos/sync`

- `GET /api/veiculos/sync` — Retorna todos os veículos ativos para sincronização mobile,
  filtrando automaticamente pelos contratos permitidos ao usuário.

## 🔧 Serviço

### VeiculoService

Responsável por toda a lógica de negócio de veículos:

- **CRUD completo** com validação e auditoria automática.
- **Integração com permissões de contrato** usando `GetUserContracts`.
- **Validação de domínio** (duplicidade de placa, existência de tipo de veículo e contrato).
- **Sincronização** de dados para clientes mobile.

## 📋 DTOs

- **CreateVeiculoDto / UpdateVeiculoDto** — Entrada validada para criação e atualização.
- **VeiculoResponseDto** — Estrutura das respostas individuais com relacionamentos (tipo e contrato).
- **VeiculoListResponseDto** — Listas paginadas com metadados completos.
- **VeiculoQueryDto** — Parâmetros de listagem (página, busca, filtros por tipo e contrato).
- **VeiculoSyncDto** — Dados completos para sincronização mobile.

## ⚙️ Constantes

`constants/veiculo.constants.ts` reúne configurações de paginação, validação,
mensagens de erro padronizadas e ordenações utilizadas pelo serviço.

## 🔐 Segurança

- **Autenticação JWT** em todos os endpoints.
- **Filtragem por contratos permitidos** via decorators `GetUserContracts` e `RequireContractPermission`.
- **Tratamento de erros padronizado** com mensagens descritivas.

## 📊 Performance

- **Paginação** configurável e busca otimizada.
- **Consultas em paralelo** para dados e contagem.
- **Logs detalhados** para auditoria e troubleshooting.

## 🚀 Uso

### Web (CRUD)

```bash
# Listar veículos com filtro por contrato
GET /api/veiculos?page=1&limit=10&contratoId=12

# Criar novo veículo
POST /api/veiculos
{
  "placa": "ABC1D23",
  "modelo": "Caminhão Basculante",
  "ano": 2024,
  "tipoVeiculoId": 5,
  "contratoId": 12
}

# Buscar veículo específico
GET /api/veiculos/101
```

### Mobile (Sync)

```bash
# Sincronizar todos os veículos permitidos
GET /api/veiculos/sync
```

## 📝 Próximos Passos

1. Implementar cache Redis para listas de veículos.
2. Adicionar testes unitários e de integração específicos.
3. Expor endpoints para histórico de odômetro (futuro).
4. Integrar com sistema de auditoria real (usuário JWT).
