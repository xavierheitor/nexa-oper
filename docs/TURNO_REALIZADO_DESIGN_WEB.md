# Design das Páginas Web: Frequência e Turnos

## Estrutura de Páginas

```
apps/web/src/app/dashboard/frequencia/
├── eletricista/
│   └── [id]/
│       └── page.tsx          # Dashboard individual
├── equipe/
│   └── [id]/
│       └── page.tsx           # Dashboard por equipe
├── faltas/
│   └── page.tsx               # Lista de faltas
└── horas-extras/
    └── page.tsx               # Lista de horas extras
```

## 1. Dashboard Individual do Eletricista

**Rota**: `/dashboard/frequencia/eletricista/[id]`

### Layout

```
┌─────────────────────────────────────────────────────────┐
│  Frequência - João Silva (E001)                          │
│  [Período: Mês Atual ▼] [Trimestre] [Custom]           │
└─────────────────────────────────────────────────────────┘

┌──────────────┐ ┌──────────────┐ ┌──────────────┐ ┌──────────────┐
│ Dias Trabalh.│ │    Faltas    │ │ Horas Extras │ │   Atrasos    │
│     22       │ │   2 (1 pend) │ │   16.5h      │ │      3       │
└──────────────┘ └──────────────┘ └──────────────┘ └──────────────┘

┌─────────────────────────────────────────────────────────┐
│  Histórico Detalhado                                    │
├──────┬──────────┬──────────┬──────────┬─────────────────┤
│ Data │   Tipo   │ Previsto │ Realizado│     Status      │
├──────┼──────────┼──────────┼──────────┼─────────────────┤
│ 15/01│ Trabalho │   8.0h   │   8.0h   │ ✅ Normal       │
│ 16/01│   Falta  │   8.0h   │   0.0h   │ ⚠️ Pendente     │
│ 17/01│ Hora Extra│   0.0h   │   8.0h   │ 💰 Pendente    │
│ 18/01│   Folga  │    -     │    -     │ ✅ Folga        │
└──────┴──────────┴──────────┴──────────┴─────────────────┤
```

### Componentes

#### ConsolidadoEletricistaCard
- **Props**: `{ resumo: ConsolidadoResumo }`
- **Exibe**: Cards com métricas principais
- **Cores**: Verde (normal), Amarelo (pendente), Vermelho (falta)

#### PeriodoSelector
- **Props**: `{ value: Periodo, onChange: (p: Periodo) => void }`
- **Opções**: Mês Atual, Trimestre, Custom (com DatePicker)
- **Valor**: `{ tipo: 'mes' | 'trimestre' | 'custom', dataInicio?: Date, dataFim?: Date }`

#### HistoricoTable
- **Props**: `{ dados: DetalhamentoDia[] }`
- **Colunas**: Data, Tipo, Horas Previstas, Horas Realizadas, Status, Ações
- **Ações**: Ver detalhes, Justificar falta, Aprovar hora extra

### Funcionalidades

1. **Filtro de Período**:
   - Mês atual (padrão)
   - Trimestre atual
   - Custom (com DatePicker para dataInicio/dataFim)

2. **Cards de Resumo**:
   - Dias Trabalhados
   - Faltas (total, justificadas, pendentes)
   - Horas Extras (total, aprovadas, pendentes)
   - Atrasos
   - Divergências de Equipe

3. **Tabela de Histórico**:
   - Lista cada dia do período
   - Mostra tipo (trabalho, falta, hora extra, folga)
   - Mostra horas previstas vs. realizadas
   - Status com cores/tags
   - Ações contextuais (justificar, aprovar, etc.)

## 2. Dashboard por Equipe

**Rota**: `/dashboard/frequencia/equipe/[id]`

### Layout

```
┌─────────────────────────────────────────────────────────┐
│  Frequência - Equipe A                                  │
│  [Período: Mês Atual ▼] [Custom]                       │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│  Eletricistas                                           │
├──────────────┬──────────┬──────────┬───────────────────┤
│ Eletricista  │ Trabalh. │  Faltas  │ Horas Extras      │
├──────────────┼──────────┼──────────┼───────────────────┤
│ João Silva   │    22    │   2 (1)  │   16.5h (12 aprov)│
│ Maria Santos │    20    │    0     │    8.0h (pend)    │
│ Pedro Costa  │    18    │    4     │    0.0h            │
└──────────────┴──────────┴──────────┴───────────────────┤
```

### Componentes

#### EquipeResumoTable
- **Props**: `{ equipeId: number, periodo: Periodo }`
- **Colunas**: Eletricista, Dias Trabalhados, Faltas, Horas Extras
- **Ações**: Clicar no eletricista → navega para dashboard individual

## 3. Lista de Faltas

**Rota**: `/dashboard/frequencia/faltas`

### Layout

```
┌─────────────────────────────────────────────────────────┐
│  Faltas                                                  │
├──────────────────────────────────────────────────────────┤
│  [Filtros: Eletricista ▼] [Equipe ▼] [Status ▼]        │
│  [Período: 01/01/2024 - 31/01/2024] [Buscar]            │
└──────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│  Lista de Faltas                                        │
├──────┬──────────────┬──────────┬──────────┬────────────┤
│ Data │ Eletricista  │  Equipe  │  Status  │   Ações    │
├──────┼──────────────┼──────────┼──────────┼────────────┤
│ 16/01│ João Silva   │ Equipe A │ Pendente │ [Justificar]│
│ 17/01│ Maria Santos │ Equipe B │ Justific │ [Ver Detalhes]│
└──────┴──────────────┴──────────┴──────────┴────────────┤
```

### Componentes

#### FaltaTable
- **Props**: `{ faltas: Falta[], onJustificar: (id: number) => void }`
- **Colunas**: Data, Eletricista, Equipe, Status, Ações
- **Filtros**: Eletricista, Equipe, Status, Período

#### JustificarFaltaModal
- **Props**: `{ faltaId: number, open: boolean, onClose: () => void }`
- **Campos**: Tipo de Justificativa, Descrição, Anexos
- **Ações**: Salvar, Cancelar

## 4. Lista de Horas Extras

**Rota**: `/dashboard/frequencia/horas-extras`

### Layout

```
┌─────────────────────────────────────────────────────────┐
│  Horas Extras                                           │
├──────────────────────────────────────────────────────────┤
│  [Filtros: Eletricista ▼] [Tipo ▼] [Status ▼]         │
│  [Período: 01/01/2024 - 31/01/2024] [Buscar]           │
└──────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│  Lista de Horas Extras                                  │
├──────┬──────────────┬──────────┬──────────┬────────────┤
│ Data │ Eletricista  │   Tipo   │  Horas   │   Ações    │
├──────┼──────────────┼──────────┼──────────┼────────────┤
│ 17/01│ João Silva   │ Folga    │   8.0h   │ [Aprovar]  │
│ 18/01│ Maria Santos │ Extrafora│   4.0h   │ [Rejeitar] │
└──────┴──────────────┴──────────┴──────────┴────────────┤
```

### Componentes

#### HoraExtraTable
- **Props**: `{ horasExtras: HoraExtra[], onAprovar: (id: number) => void, onRejeitar: (id: number) => void }`
- **Colunas**: Data, Eletricista, Tipo, Horas Previstas, Horas Realizadas, Diferença, Status, Ações
- **Filtros**: Eletricista, Tipo, Status, Período

#### AprovarHoraExtraModal
- **Props**: `{ horaExtraId: number, open: boolean, onClose: () => void }`
- **Campos**: Observações (opcional)
- **Ações**: Aprovar, Rejeitar, Cancelar

## Componentes Compartilhados

### PeriodoSelector
- Reutilizável em todas as páginas
- Props: `{ value, onChange, opcoes: ['mes', 'trimestre', 'custom'] }`

### StatusTag
- Componente para exibir status com cores
- Props: `{ status: string, tipo: 'falta' | 'horaExtra' | 'geral' }`
- Cores:
  - Pendente: Amarelo
  - Aprovada/Justificada: Verde
  - Rejeitada/Indeferida: Vermelho

### TipoHoraExtraTag
- Componente para exibir tipo de hora extra
- Props: `{ tipo: string }`
- Labels:
  - `folga_trabalhada`: "Folga Trabalhada"
  - `extrafora`: "Trabalho Extrafora"
  - `atraso_compensado`: "Atraso Compensado"
  - `troca_folga`: "Troca de Folga"

## Schemas Zod

### ConsolidadoEletricistaResponse
```typescript
z.object({
  eletricista: z.object({ id: z.number(), nome: z.string(), matricula: z.string() }),
  periodo: z.object({ dataInicio: z.date(), dataFim: z.date() }),
  resumo: z.object({
    diasTrabalhados: z.number(),
    faltas: z.number(),
    horasExtras: z.number(),
    // ...
  }),
  detalhamento: z.array(z.object({
    data: z.date(),
    tipo: z.enum(['trabalho', 'falta', 'hora_extra', 'folga']),
    // ...
  })),
});
```

## Navegação

### Breadcrumbs
- Dashboard > Frequência > Eletricista: João Silva
- Dashboard > Frequência > Equipe: Equipe A
- Dashboard > Frequência > Faltas
- Dashboard > Frequência > Horas Extras

### Links de Navegação
- Da lista de equipe → dashboard individual do eletricista
- Do dashboard individual → lista de faltas (filtrado)
- Do dashboard individual → lista de horas extras (filtrado)

## Responsividade

- Cards: Grid responsivo (1-4 colunas)
- Tabelas: Scroll horizontal em mobile
- Filtros: Colapsáveis em mobile

