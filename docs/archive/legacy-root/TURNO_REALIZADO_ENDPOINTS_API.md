# Endpoints da API: Turnos Realizados e Frequência

## Base URL
`/api/turnos-realizados`

## Autenticação
Todos os endpoints requerem autenticação JWT (exceto documentação).

## Endpoints de Consulta Agregada

### 1. Consolidado por Eletricista

**Endpoint**: `GET /api/turnos-realizados/consolidado/eletricista/:eletricistaId`

**Descrição**: Retorna dados consolidados de frequência de um eletricista em um período.

**Parâmetros de Rota**:
- `eletricistaId` (number): ID do eletricista

**Query Parameters**:
- `dataInicio` (string, ISO date): Data inicial do período (obrigatório)
- `dataFim` (string, ISO date): Data final do período (obrigatório)
- `periodo` (string, opcional): Atalho de período
  - Valores: `mes` (mês atual), `trimestre` (trimestre atual), `custom` (usa dataInicio/dataFim)
  - Default: `custom`

**Resposta** (200 OK):
```json
{
  "eletricista": {
    "id": 1,
    "nome": "João Silva",
    "matricula": "E001"
  },
  "periodo": {
    "dataInicio": "2024-01-01T00:00:00Z",
    "dataFim": "2024-01-31T23:59:59Z"
  },
  "resumo": {
    "diasTrabalhados": 22,
    "diasEscalados": 20,
    "faltas": 2,
    "faltasJustificadas": 1,
    "faltasPendentes": 1,
    "horasExtras": 16.5,
    "horasExtrasAprovadas": 12.0,
    "horasExtrasPendentes": 4.5,
    "atrasos": 3,
    "divergenciasEquipe": 1
  },
  "detalhamento": [
    {
      "data": "2024-01-15T00:00:00Z",
      "tipo": "trabalho",
      "horasPrevistas": 8.0,
      "horasRealizadas": 8.0,
      "status": "normal"
    },
    {
      "data": "2024-01-16T00:00:00Z",
      "tipo": "falta",
      "horasPrevistas": 8.0,
      "horasRealizadas": 0,
      "status": "pendente",
      "faltaId": 123
    },
    {
      "data": "2024-01-17T00:00:00Z",
      "tipo": "hora_extra",
      "horasPrevistas": 0,
      "horasRealizadas": 8.0,
      "tipoHoraExtra": "folga_trabalhada",
      "status": "pendente",
      "horaExtraId": 456
    }
  ]
}
```

**Erros**:
- 404: Eletricista não encontrado
- 400: Parâmetros inválidos (dataInicio > dataFim, etc.)

### 2. Consolidado por Equipe

**Endpoint**: `GET /api/turnos-realizados/consolidado/equipe/:equipeId`

**Descrição**: Retorna dados consolidados de frequência de todos os eletricistas de uma equipe em um período.

**Parâmetros de Rota**:
- `equipeId` (number): ID da equipe

**Query Parameters**:
- `dataInicio` (string, ISO date): Data inicial do período (obrigatório)
- `dataFim` (string, ISO date): Data final do período (obrigatório)

**Resposta** (200 OK):
```json
{
  "equipe": {
    "id": 1,
    "nome": "Equipe A"
  },
  "periodo": {
    "dataInicio": "2024-01-01T00:00:00Z",
    "dataFim": "2024-01-31T23:59:59Z"
  },
  "eletricistas": [
    {
      "eletricista": {
        "id": 1,
        "nome": "João Silva",
        "matricula": "E001"
      },
      "resumo": {
        "diasTrabalhados": 22,
        "faltas": 2,
        "horasExtras": 16.5
      }
    },
    {
      "eletricista": {
        "id": 2,
        "nome": "Maria Santos",
        "matricula": "E002"
      },
      "resumo": {
        "diasTrabalhados": 20,
        "faltas": 0,
        "horasExtras": 8.0
      }
    }
  ]
}
```

**Erros**:
- 404: Equipe não encontrada
- 400: Parâmetros inválidos

### 3. Lista de Faltas

**Endpoint**: `GET /api/turnos-realizados/faltas`

**Descrição**: Lista faltas com filtros opcionais.

**Query Parameters**:
- `eletricistaId` (number, opcional): Filtrar por eletricista
- `equipeId` (number, opcional): Filtrar por equipe
- `dataInicio` (string, ISO date, opcional): Data inicial
- `dataFim` (string, ISO date, opcional): Data final
- `status` (string, opcional): Filtrar por status (`pendente` | `justificada` | `indeferida`)
- `page` (number, opcional): Página (default: 1)
- `pageSize` (number, opcional): Itens por página (default: 20)

**Resposta** (200 OK):
```json
{
  "data": [
    {
      "id": 123,
      "dataReferencia": "2024-01-15T00:00:00Z",
      "eletricista": {
        "id": 1,
        "nome": "João Silva",
        "matricula": "E001"
      },
      "equipe": {
        "id": 1,
        "nome": "Equipe A"
      },
      "motivoSistema": "falta_abertura",
      "status": "pendente",
      "justificativas": [],
      "createdAt": "2024-01-16T00:00:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "pageSize": 20,
    "total": 45,
    "totalPages": 3
  }
}
```

### 4. Lista de Horas Extras

**Endpoint**: `GET /api/turnos-realizados/horas-extras`

**Descrição**: Lista horas extras com filtros opcionais.

**Query Parameters**:
- `eletricistaId` (number, opcional): Filtrar por eletricista
- `dataInicio` (string, ISO date, opcional): Data inicial
- `dataFim` (string, ISO date, opcional): Data final
- `tipo` (string, opcional): Filtrar por tipo (`folga_trabalhada` | `extrafora` | `atraso_compensado` | `troca_folga`)
- `status` (string, opcional): Filtrar por status (`pendente` | `aprovada` | `rejeitada`)
- `page` (number, opcional): Página (default: 1)
- `pageSize` (number, opcional): Itens por página (default: 20)

**Resposta** (200 OK):
```json
{
  "data": [
    {
      "id": 456,
      "dataReferencia": "2024-01-17T00:00:00Z",
      "eletricista": {
        "id": 1,
        "nome": "João Silva",
        "matricula": "E001"
      },
      "tipo": "folga_trabalhada",
      "horasPrevistas": 0,
      "horasRealizadas": 8.0,
      "diferencaHoras": 8.0,
      "status": "pendente",
      "observacoes": null,
      "createdAt": "2024-01-17T08:00:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "pageSize": 20,
    "total": 120,
    "totalPages": 6
  }
}
```

### 5. Aprovar/Rejeitar Hora Extra

**Endpoint**: `PATCH /api/turnos-realizados/horas-extras/:id/aprovacao`

**Descrição**: Aprova ou rejeita uma hora extra.

**Parâmetros de Rota**:
- `id` (number): ID da hora extra

**Body**:
```json
{
  "acao": "aprovar", // ou "rejeitar"
  "observacoes": "Aprovado conforme solicitação"
}
```

**Resposta** (200 OK):
```json
{
  "id": 456,
  "status": "aprovada",
  "updatedAt": "2024-01-18T10:00:00Z",
  "updatedBy": "gestor@example.com"
}
```

## DTOs (Data Transfer Objects)

### ConsolidadoEletricistaDto
```typescript
{
  eletricista: { id: number; nome: string; matricula: string };
  periodo: { dataInicio: Date; dataFim: Date };
  resumo: {
    diasTrabalhados: number;
    diasEscalados: number;
    faltas: number;
    faltasJustificadas: number;
    faltasPendentes: number;
    horasExtras: number;
    horasExtrasAprovadas: number;
    horasExtrasPendentes: number;
    atrasos: number;
    divergenciasEquipe: number;
  };
  detalhamento: Array<{
    data: Date;
    tipo: 'trabalho' | 'falta' | 'hora_extra' | 'folga';
    horasPrevistas: number;
    horasRealizadas: number;
    status: string;
    faltaId?: number;
    horaExtraId?: number;
    tipoHoraExtra?: string;
  }>;
}
```

### FaltaFilterDto
```typescript
{
  eletricistaId?: number;
  equipeId?: number;
  dataInicio?: string;
  dataFim?: string;
  status?: 'pendente' | 'justificada' | 'indeferida';
  page?: number;
  pageSize?: number;
}
```

### HoraExtraFilterDto
```typescript
{
  eletricistaId?: number;
  dataInicio?: string;
  dataFim?: string;
  tipo?: 'folga_trabalhada' | 'extrafora' | 'atraso_compensado' | 'troca_folga';
  status?: 'pendente' | 'aprovada' | 'rejeitada';
  page?: number;
  pageSize?: number;
}
```

## Validações

- `dataInicio` e `dataFim` devem ser datas válidas
- `dataInicio` não pode ser maior que `dataFim`
- Período máximo: 1 ano (365 dias)
- `page` e `pageSize` devem ser números positivos
- `pageSize` máximo: 100

## Performance

- Consultas agregadas usam índices adequados
- Paginação para listas grandes
- Cache opcional para consultas frequentes (futuro)

