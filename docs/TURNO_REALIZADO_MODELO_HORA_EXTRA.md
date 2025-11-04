# Modelo de Dados: Hora Extra

## Objetivo
Registrar horas extras trabalhadas por eletricistas, incluindo trabalhos em dias de folga, trabalhos extrafora (sem escala), e compensações de atrasos.

## Modelo Prisma

```prisma
model HoraExtra {
  id              Int       @id @default(autoincrement())
  dataReferencia  DateTime
  eletricistaId   Int
  eletricista     Eletricista @relation(fields: [eletricistaId], references: [id])

  // Relacionamento opcional com turno realizado
  turnoRealizadoEletricistaId Int?
  turnoRealizadoEletricista   TurnoRealizadoEletricista? @relation(
    fields: [turnoRealizadoEletricistaId],
    references: [id]
  )

  // Tipo de hora extra
  tipo            String    @db.VarChar(32)
  // Valores: folga_trabalhada | extrafora | atraso_compensado | troca_folga

  // Horas previstas (se houver escala)
  horasPrevistas  Decimal?  @db.Decimal(5,2)

  // Horas realmente trabalhadas
  horasRealizadas Decimal   @db.Decimal(5,2)

  // Diferença calculada (horasRealizadas - horasPrevistas)
  diferencaHoras  Decimal   @db.Decimal(5,2)

  // Observações/justificativa
  observacoes     String?   @db.VarChar(1000)

  // Status de aprovação
  status          String    @db.VarChar(16)
  // Valores: pendente | aprovada | rejeitada

  // Relacionamento com slot de escala (se houver)
  escalaSlotId    Int?
  escalaSlot      SlotEscala? @relation(fields: [escalaSlotId], references: [id])

  // Auditoria
  createdAt       DateTime  @default(now())
  createdBy       String    @db.VarChar(255)
  updatedAt       DateTime? @updatedAt
  updatedBy       String?   @db.VarChar(255)

  @@index([eletricistaId, dataReferencia])
  @@index([dataReferencia])
  @@index([status])
  @@index([tipo])
}
```

## Tipos de Hora Extra

### 1. `folga_trabalhada`
- **Quando**: Eletricista estava de folga na escala (`SlotEscala.estado = FOLGA`) mas abriu turno
- **Horas Previstas**: 0 (não tinha escala)
- **Cálculo**: `horasRealizadas - 0 = horasRealizadas`
- **Exemplo**: João tinha folga, mas trabalhou 8h → 8h de hora extra

### 2. `extrafora`
- **Quando**: Eletricista abriu turno sem estar em nenhuma escala (nem trabalho, nem folga)
- **Horas Previstas**: 0 (sem escala)
- **Cálculo**: `horasRealizadas - 0 = horasRealizadas`
- **Exemplo**: Maria trabalhou em dia que não tinha escala → trabalho extra

### 3. `atraso_compensado`
- **Quando**: Eletricista chegou atrasado mas compensou trabalhando mais horas
- **Horas Previstas**: Horas da escala normal
- **Cálculo**: `horasRealizadas - horasPrevistas = diferencaHoras`
- **Exemplo**: Escala previa 8h, chegou 1h atrasado, trabalhou 9h → 0h (compensou) ou positivo se trabalhou mais

### 4. `troca_folga`
- **Quando**: Eletricista A estava de folga, mas B abriu turno (possível troca)
- **Horas Previstas**: 0 (folga do eletricista A)
- **Observação**: Precisa validação manual para confirmar se foi troca ou não

## Relacionamentos

### Com TurnoRealizadoEletricista
- **Opcional**: Nem toda hora extra precisa ter um turno realizado (ex: trabalho manual)
- **Quando usar**: Se a hora extra veio de um turno aberto no sistema

### Com SlotEscala
- **Opcional**: Nem toda hora extra tem escala (ex: extrafora)
- **Quando usar**: Se a hora extra está relacionada a um slot de escala (folga_trabalhada)

## Campos de Cálculo

### horasPrevistas
- Buscar de `SlotEscala.inicioPrevisto` e `fimPrevisto` se houver
- Ou de configuração padrão da equipe (`EquipeTurnoHistorico`)
- Pode ser `null` se não houver escala

### horasRealizadas
- Calcular de `TurnoRealizadoEletricista.abertoEm` até `fechadoEm`
- Ou informado manualmente se não houver turno registrado
- **Sempre obrigatório**

### diferencaHoras
- Calcular automaticamente: `horasRealizadas - (horasPrevistas || 0)`
- **Sempre positivo** (se negativo, não é hora extra, é atraso/falta)

## Status

- **pendente**: Aguardando aprovação (padrão)
- **aprovada**: Aprovada por gestor
- **rejeitada**: Rejeitada (não contará como hora extra)

## Índices

- `[eletricistaId, dataReferencia]`: Consultas por eletricista e data
- `[dataReferencia]`: Consultas por período
- `[status]`: Filtros por status de aprovação
- `[tipo]`: Filtros por tipo de hora extra

## Migração

```sql
-- Adicionar relacionamento em TurnoRealizadoEletricista
ALTER TABLE TurnoRealizadoEletricista
ADD COLUMN horaExtraId INT NULL;

-- Adicionar relacionamento em SlotEscala (se necessário)
ALTER TABLE SlotEscala
ADD COLUMN horaExtraId INT NULL;
```

## Exemplos de Uso

### Caso 1: Folga Trabalhada
```
SlotEscala: estado = FOLGA, data = 2024-01-15
TurnoRealizadoEletricista: abertoEm = 2024-01-15 08:00, fechadoEm = 2024-01-15 17:00

HoraExtra:
- tipo: folga_trabalhada
- horasPrevistas: 0
- horasRealizadas: 9.0
- diferencaHoras: 9.0
- status: pendente
```

### Caso 2: Trabalho Extrafora
```
Sem SlotEscala para o eletricista na data
TurnoRealizadoEletricista: abertoEm = 2024-01-20 08:00, fechadoEm = 2024-01-20 16:00

HoraExtra:
- tipo: extrafora
- horasPrevistas: 0
- horasRealizadas: 8.0
- diferencaHoras: 8.0
- status: pendente
```

### Caso 3: Atraso Compensado
```
SlotEscala: inicioPrevisto = 08:00, fimPrevisto = 17:00
TurnoRealizadoEletricista: abertoEm = 2024-01-10 09:00 (1h atraso), fechadoEm = 2024-01-10 18:00

HoraExtra:
- tipo: atraso_compensado
- horasPrevistas: 9.0
- horasRealizadas: 9.0
- diferencaHoras: 0.0 (compensou)
- observacoes: "Atraso de 1h compensado trabalhando 1h a mais"
- status: aprovada
```

