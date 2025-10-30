# Reconciliação Automática de Turnos

## 🎯 Como Funciona

Quando um turno é aberto via **POST** `/api/turnos/aberturas`, o sistema executa uma **reconciliação automática assíncrona** que compara a escala planejada com os turnos realmente abertos.

---

## 📊 Fluxo de Reconciliação

```
┌─────────────────────────────────────────────────────────┐
│ 1. POST /api/turnos/aberturas                           │
│    - Equipe abre turno com eletricistas                 │
│    - Turno salvo na tabela TurnoRealizado              │
└─────────────────────────────────────────────────────────┘
                        ↓
┌─────────────────────────────────────────────────────────┐
│ 2. Reconciliação Automática (ASSÍNCRONA)                │
│    • Busca slots da escala prevista                     │
│    • Busca turnos realmente abertos                     │
│    • Compara para cada eletricista                      │
└─────────────────────────────────────────────────────────┘
                        ↓
        ┌───────────────┴───────────────┐
        ↓                               ↓
┌───────────────────────┐   ┌───────────────────────────┐
│ Escalado mas não      │   │ Escalado em equipe        │
│ abriu = FALTA         │   │ diferente = DIVERGÊNCIA   │
│                       │   │                           │
│ Cria registro em:     │   │ Cria registro em:         │
│ • Falta               │   │ • DivergenciaEscala       │
│   - motivoSistema:    │   │   - tipo: equipe_diverge  │
│     "falta_abertura"  │   │   - equipePrevistaId      │
│   - status:           │   │   - equipeRealId          │
│     "pendente"        │   │                           │
└───────────────────────┘   └───────────────────────────┘
```

---

## 🔍 Detalhamento Técnico

### 1. Abertura de Turno

```typescript
// TurnoRealizadoService.abrirTurno()
const turno = await tx.turnoRealizado.create({
  data: {
    dataReferencia: dataRef,
    equipeId: payload.equipeId,
    origem: 'mobile',
    abertoEm: new Date(),
    abertoPor: payload.executadoPor,
  }
});

// Cria registros dos eletricistas que abriram
await tx.turnoRealizadoEletricista.createMany({...});
```

### 2. Reconciliação Assíncrona

```typescript
// Executado FORA da transação (não bloqueia resposta)
this.turnoReconciliacaoService
  .reconciliarDiaEquipe({
    dataReferencia: payload.dataReferencia,
    equipePrevistaId: payload.equipeId,
    executadoPor: payload.executadoPor,
  })
  .then(() => {
    console.log('✅ Reconciliação concluída');
  })
  .catch((error) => {
    console.error('❌ Erro na reconciliação:', error);
  });
```

### 3. Lógica de Reconciliação

```typescript
// TurnoReconciliacaoService.reconciliarDiaEquipe()

// 1. Buscar escala prevista (SlotsEscala)
const slots = await prisma.slotEscala.findMany({
  where: {
    data: dataRef,
    escalaEquipePeriodo: { equipeId: equipePrevistaId },
  }
});

// 2. Buscar turnos realmente abertos
const aberturasDia = await prisma.turnoRealizadoEletricista.findMany({
  where: { turnoRealizado: { dataReferencia: dataRef } }
});

// 3. Agrupar aberturas por eletricista e equipe
const abertosPorEletricista = new Map();

// 4. Para cada eletricista escalado:
for (const slot of slots) {
  const equipesReais = abertosPorEletricista.get(slot.eletricistaId);
  
  // CASO 1: Não abriu turno = FALTA
  if (!equipesReais || equipesReais.size === 0) {
    await prisma.falta.create({
      data: {
        motivoSistema: 'falta_abertura',
        status: 'pendente',
        ...
      }
    });
    continue;
  }
  
  // CASO 2: Abriu em equipe diferente = DIVERGÊNCIA
  if (!equipesReais.has(equipePrevistaId)) {
    const equipeRealId = [...equipesReais][0];
    await prisma.divergenciaEscala.create({
      data: {
        tipo: 'equipe_divergente',
        equipePrevistaId,
        equipeRealId,
        ...
      }
    });
  }
}
```

---

## 📋 Tabelas Atualizadas

### Falta
Registra quando um eletricista escalado não abriu o turno.

```sql
INSERT INTO Falta (
  dataReferencia,
  equipeId,
  eletricistaId,
  escalaSlotId,
  motivoSistema,  -- 'falta_abertura'
  status,         -- 'pendente'
  createdBy       -- 'system'
)
```

### DivergenciaEscala
Registra quando eletricista abriu turno em equipe diferente da escala.

```sql
INSERT INTO DivergenciaEscala (
  dataReferencia,
  equipePrevistaId,  -- Equipe da escala
  equipeRealId,      -- Equipe que abriu turno
  eletricistaId,
  tipo,              -- 'equipe_divergente'
  createdBy
)
```

---

## 🧪 Cenários de Teste

### Cenário 1: Falta Automática
```
Escala Prevista:
- Eletricista 1 (Equipe A)
- Eletricista 2 (Equipe A)

Abertura Real:
- Eletricista 1 abriu turno na Equipe A

Resultado:
✅ Eletricista 1: Sem falta (abriu corretamente)
❌ Eletricista 2: FALTA criada automaticamente
```

### Cenário 2: Divergência de Equipe
```
Escala Prevista:
- Eletricista 1 (Equipe A)

Abertura Real:
- Eletricista 1 abriu turno na Equipe B

Resultado:
⚠️ DIVERGÊNCIA criada: equipe_divergente
   - equipePrevistaId: 1 (A)
   - equipeRealId: 2 (B)
```

### Cenário 3: Turno Fora de Escala
```
Escala Prevista:
- Ninguém

Abertura Real:
- Eletricista 3 abriu turno na Equipe A

Resultado:
✅ Nenhuma inconsistência (turno extrafora é permitido)
```

---

## ⚡ Performance

- **Assíncrono**: Não bloqueia resposta da API
- **Idempotente**: Chaves únicas evitam duplicatas
- **Resiliente**: Erros não afetam criação do turno
- **Eficiente**: Usa Map para agregações O(n)

---

## 🔗 Próximos Passos

1. **Endpoints para consultar faltas/divergências**
2. **Dashboard de reconciliacão**
3. **Notificações automáticas de faltas**
4. **Job agendado para reconciliar dias anteriores**

