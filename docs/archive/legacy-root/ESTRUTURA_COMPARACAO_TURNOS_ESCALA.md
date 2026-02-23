# Estrutura Detalhada: Comparação de Turnos Executados com Escala

## 📋 Índice

1. [Visão Geral](#visão-geral)
2. [Estrutura do Banco de Dados](#estrutura-do-banco-de-dados)
3. [Fluxo de Funcionamento](#fluxo-de-funcionamento)
4. [Lógica de Reconciliação](#lógica-de-reconciliação)
5. [Casos de Uso Detalhados](#casos-de-uso-detalhados)
6. [Problemas Potenciais](#problemas-potenciais)

---

## 🎯 Visão Geral

O sistema compara **turnos realmente executados** (registrados quando a equipe abre o turno no
mobile/backoffice) com a **escala planejada** (definida previamente no sistema). Essa comparação
gera:

- ✅ **Normal**: Tudo conforme esperado
- ❌ **Falta**: Escalado mas não abriu turno
- ⚠️ **Divergência**: Escalado em uma equipe mas abriu em outra
- 💰 **Hora Extra**: Trabalhou em folga, extrafora, ou compensou atraso
- 📝 **Dia Trabalhado Fora Escala**: Trabalhou sem ter escala cadastrada (mas NÃO é hora extra)

---

## 🗄️ Estrutura do Banco de Dados

### Tabelas Principais

#### 1. `TurnoRealizado`

**O que é**: Registro de que uma equipe abriu um turno em uma data específica.

```sql
CREATE TABLE TurnoRealizado (
  id INT PRIMARY KEY AUTO_INCREMENT,
  dataReferencia DATETIME NOT NULL,  -- Data do turno (ex: 2024-01-15)
  equipeId INT NOT NULL,              -- Equipe que abriu o turno
  origem VARCHAR(32),                 -- 'mobile' ou 'backoffice'
  abertoEm DATETIME NOT NULL,         -- Quando foi aberto
  abertoPor VARCHAR(255),             -- Quem abriu
  fechadoEm DATETIME NULL,            -- Quando foi fechado (se fechado)
  fechadoPor VARCHAR(255) NULL,       -- Quem fechou
  createdAt DATETIME,
  createdBy VARCHAR(255)
);
```

**Índices**:

- `idx_dataReferencia`: Para buscar por data
- `idx_equipeId_dataReferencia`: Para buscar por equipe e data

---

#### 2. `TurnoRealizadoEletricista`

**O que é**: Registro de cada eletricista que participou do turno.

```sql
CREATE TABLE TurnoRealizadoEletricista (
  id INT PRIMARY KEY AUTO_INCREMENT,
  turnoRealizadoId INT NOT NULL,       -- FK para TurnoRealizado
  eletricistaId INT NOT NULL,          -- Eletricista que abriu
  status VARCHAR(16),                  -- 'aberto' ou 'fechado'
  abertoEm DATETIME NOT NULL,          -- Quando o eletricista abriu
  fechadoEm DATETIME NULL,            -- Quando o eletricista fechou
  deviceInfo VARCHAR(1000) NULL,      -- Info do dispositivo mobile
  createdAt DATETIME,
  createdBy VARCHAR(255)
);
```

**Índices**:

- `idx_turnoRealizadoId`: Para buscar por turno
- `idx_eletricistaId`: Para buscar por eletricista
- `idx_status`: Para buscar por status

**Relacionamentos**:

- `TurnoRealizado` → `TurnoRealizadoEletricista` (1:N)
- `Eletricista` → `TurnoRealizadoEletricista` (1:N)
- `TurnoRealizadoEletricista` → `HoraExtra` (1:N)

---

#### 3. `EscalaEquipePeriodo`

**O que é**: Período de escala de uma equipe (ex: Janeiro 2024).

```sql
CREATE TABLE EscalaEquipePeriodo (
  id INT PRIMARY KEY AUTO_INCREMENT,
  equipeId INT NOT NULL,
  periodoInicio DATETIME NOT NULL,    -- Início do período (ex: 2024-01-01)
  periodoFim DATETIME NOT NULL,       -- Fim do período (ex: 2024-01-31)
  tipoEscalaId INT NOT NULL,           -- Tipo de escala (4x2, Espanhola, etc.)
  status VARCHAR(32),                 -- 'RASCUNHO', 'EM_APROVACAO', 'PUBLICADA', 'ARQUIVADA'
  versao INT DEFAULT 1,
  observacoes VARCHAR(1000),
  createdAt DATETIME,
  createdBy VARCHAR(255)
);
```

**Status Importante**:

- Apenas escalas com `status = 'PUBLICADA'` são consideradas na reconciliação
- Escalas em `RASCUNHO` ou `EM_APROVACAO` são ignoradas

---

#### 4. `SlotEscala`

**O que é**: Cada dia/escala de um eletricista específico.

```sql
CREATE TABLE SlotEscala (
  id INT PRIMARY KEY AUTO_INCREMENT,
  escalaEquipePeriodoId INT NOT NULL,  -- FK para EscalaEquipePeriodo
  eletricistaId INT NOT NULL,          -- Eletricista escalado
  data DATETIME NOT NULL,              -- Data do slot (ex: 2024-01-15)
  estado VARCHAR(16) NOT NULL,        -- 'TRABALHO', 'FOLGA', 'FALTA', 'EXCECAO'
  inicioPrevisto VARCHAR(8) NULL,     -- Horário previsto início (ex: '08:00:00')
  fimPrevisto VARCHAR(8) NULL,        -- Horário previsto fim (ex: '17:00:00')
  anotacoesDia VARCHAR(1000),
  origem VARCHAR(32),                  -- 'GERACAO', 'MANUAL', 'REMANEJAMENTO'
  observacoes VARCHAR(1000),
  createdAt DATETIME,
  createdBy VARCHAR(255),

  UNIQUE KEY (escalaEquipePeriodoId, data, eletricistaId)
);
```

**Estados Importantes**:

- `TRABALHO`: Eletricista deveria trabalhar neste dia
- `FOLGA`: Eletricista está de folga
- `FALTA`: Eletricista faltou (marcado manualmente)
- `EXCECAO`: Situação excepcional

**Índices**:

- `idx_data`: Para buscar por data
- `idx_eletricistaId_data`: Para buscar por eletricista e data
- `UNIQUE (escalaEquipePeriodoId, data, eletricistaId)`: Garante um slot por dia/eletricista/período

**Relacionamentos**:

- `EscalaEquipePeriodo` → `SlotEscala` (1:N)
- `Eletricista` → `SlotEscala` (1:N)
- `SlotEscala` → `Falta` (1:N)
- `SlotEscala` → `HoraExtra` (1:N)

---

#### 5. `Falta`

**O que é**: Registro de falta quando eletricista escalado não abriu turno.

```sql
CREATE TABLE Falta (
  id INT PRIMARY KEY AUTO_INCREMENT,
  dataReferencia DATETIME NOT NULL,
  equipeId INT NOT NULL,              -- Equipe da escala
  eletricistaId INT NOT NULL,         -- Eletricista que faltou
  escalaSlotId INT NULL,              -- FK opcional para SlotEscala
  motivoSistema VARCHAR(64),          -- 'falta_abertura'
  status VARCHAR(16),                 -- 'pendente', 'justificada', 'indeferida'
  createdAt DATETIME,
  createdBy VARCHAR(255),              -- 'system' ou userId

  UNIQUE KEY (dataReferencia, equipeId, eletricistaId, motivoSistema)
);
```

**Regras**:

- Criada automaticamente quando: Escala `TRABALHO` + Eletricista NÃO abriu turno
- Não cria falta se: Eletricista abriu em outra equipe (cria divergência)
- Não cria falta se: Status do eletricista justifica ausência (FERIAS, LICENCA_MEDICA, etc.)
- Não cria falta se: Equipe tem justificativa aprovada que não gera falta

---

#### 6. `DivergenciaEscala`

**O que é**: Registro quando eletricista escalado em uma equipe abriu turno em outra.

```sql
CREATE TABLE DivergenciaEscala (
  id INT PRIMARY KEY AUTO_INCREMENT,
  dataReferencia DATETIME NOT NULL,
  equipePrevistaId INT NOT NULL,      -- Equipe onde deveria estar
  equipeRealId INT NOT NULL,          -- Equipe onde realmente abriu
  eletricistaId INT NOT NULL,
  tipo VARCHAR(64),                   -- 'equipe_divergente'
  detalhe VARCHAR(1000),
  createdAt DATETIME,
  createdBy VARCHAR(255),

  UNIQUE KEY (dataReferencia, eletricistaId, equipePrevistaId, equipeRealId)
);
```

**Regras**:

- Criada quando: Escala `TRABALHO` + Eletricista abriu em equipe diferente
- **NÃO cria falta** porque o eletricista trabalhou, apenas em equipe diferente

---

#### 7. `HoraExtra`

**O que é**: Registro de horas extras trabalhadas.

```sql
CREATE TABLE HoraExtra (
  id INT PRIMARY KEY AUTO_INCREMENT,
  dataReferencia DATETIME NOT NULL,
  eletricistaId INT NOT NULL,
  turnoRealizadoEletricistaId INT NULL,  -- FK opcional para TurnoRealizadoEletricista
  escalaSlotId INT NULL,                 -- FK opcional para SlotEscala
  tipo VARCHAR(32),                      -- 'folga_trabalhada', 'extrafora', 'atraso_compensado', 'troca_folga'
  horasPrevistas DECIMAL(5,2) NULL,      -- Horas previstas (0 se folga/sem escala)
  horasRealizadas DECIMAL(5,2) NOT NULL, -- Horas realmente trabalhadas
  diferencaHoras DECIMAL(5,2) NOT NULL,   -- diferencaHoras = horasRealizadas - horasPrevistas
  observacoes VARCHAR(1000),
  status VARCHAR(16),                     -- 'pendente', 'aprovada', 'rejeitada'
  createdAt DATETIME,
  createdBy VARCHAR(255),
  updatedAt DATETIME,
  updatedBy VARCHAR(255)
);
```

**Tipos de Hora Extra**:

1. **`folga_trabalhada`**:
   - Quando: Escala `FOLGA` + Eletricista abriu turno
   - `horasPrevistas`: 0 (folga)
   - `horasRealizadas`: Calculado de `abertoEm` até `fechadoEm`
   - `diferencaHoras`: `horasRealizadas` (já que previsto é 0)
   - `escalaSlotId`: Preenchido (slot de folga)

2. **`extrafora`**:
   - Quando: Eletricista abriu turno SEM estar em nenhuma escala (nem trabalho, nem folga)
   - `horasPrevistas`: 0 (sem escala)
   - `horasRealizadas`: Calculado de `abertoEm` até `fechadoEm`
   - `diferencaHoras`: `horasRealizadas`
   - `escalaSlotId`: NULL (não tem slot)

3. **`atraso_compensado`**:
   - Quando: Escala `TRABALHO` + Eletricista abriu com atraso (>30min) mas compensou trabalhando
     mais
   - `horasPrevistas`: Calculado da escala (`fimPrevisto - inicioPrevisto`)
   - `horasRealizadas`: Calculado do turno (`fechadoEm - abertoEm`)
   - `diferencaHoras`: `horasRealizadas - horasPrevistas` (se positivo)
   - `escalaSlotId`: Preenchido (slot de trabalho)

4. **`troca_folga`**:
   - Quando: Eletricista A estava de folga, mas Eletricista B abriu turno (possível troca)
   - `horasPrevistas`: 0 (B não tinha escala)
   - `horasRealizadas`: Calculado do turno de B
   - `diferencaHoras`: `horasRealizadas`
   - `observacoes`: "Possível troca com Eletricista A"

**Índices**:

- `idx_eletricistaId_dataReferencia`: Para buscar por eletricista e data
- `idx_dataReferencia`: Para buscar por data
- `idx_status`: Para buscar por status
- `idx_tipo`: Para buscar por tipo

---

## 🔄 Fluxo de Funcionamento

### 1. Abertura de Turno

Quando uma equipe abre um turno (via mobile ou backoffice):

```typescript
// apps/api/src/modules/turno-realizado/turno-realizado.service.ts

async abrirTurno(payload: AbrirTurnoPayload) {
  // 1. Criar TurnoRealizado
  const turno = await prisma.turnoRealizado.create({
    data: {
      dataReferencia: payload.dataReferencia,
      equipeId: payload.equipeId,
      origem: payload.origem ?? 'mobile',
      abertoEm: new Date(),
      abertoPor: payload.executadoPor,
    },
  });

  // 2. Criar TurnoRealizadoEletricista para cada eletricista
  await prisma.turnoRealizadoEletricista.createMany({
    data: payload.eletricistasAbertos.map((e) => ({
      turnoRealizadoId: turno.id,
      eletricistaId: e.eletricistaId,
      status: 'aberto',
      abertoEm: e.abertoEm ? new Date(e.abertoEm) : new Date(),
    })),
  });

  // 3. Disparar reconciliação ASSÍNCRONA (não bloqueia resposta)
  this.turnoReconciliacaoService
    .reconciliarDiaEquipe({
      dataReferencia: payload.dataReferencia,
      equipePrevistaId: payload.equipeId,
      executadoPor: payload.executadoPor,
    })
    .catch((error) => {
      this.logger.error('Erro na reconciliação:', error);
    });
}
```

**Pontos Importantes**:

- A reconciliação é **assíncrona** (não bloqueia a resposta da API)
- Se a **reconciliação** falhar, o turno ainda é salvo (mas não gera faltas/horas extras)
****
---
****
### 2. Reconciliação Automática

A reconciliação pode ser acionada de duas formas:

#### A) Imediatamente após abertura de turno (assíncrona)

- Chamada automaticamente após `abrirTurno()`
- Executa em background (não bloqueia)

#### B) Job diário às 23h (scheduler)

- Processa últimos 30 dias
- Aguarda margem de 30 minutos após horário previsto antes de marcar falta
- Garante que dias não reconciliados sejam processados

```typescript
// apps/api/src/modules/turno-realizado/turno-reconciliacao-scheduler.service.ts

@Cron('0 23 * * *', {
  name: 'reconciliacao-turnos-diaria',
  timeZone: 'America/Sao_Paulo',
})
async executarReconciliacaoDiaria(): Promise<void> {
  // Buscar todas as equipes com escala PUBLICADA
  // Para cada equipe, processar últimos 30 dias
  // Aguardar margem de 30 minutos após inicioPrevisto
  // Chamar reconciliarDiaEquipe() para cada dia
}
```

---

## 🧮 Lógica de Reconciliação

### Método Principal: `reconciliarDiaEquipe()`

```typescript
// apps/api/src/modules/turno-realizado/turno-reconciliacao.service.ts

async reconciliarDiaEquipe(params: ReconciliarParams): Promise<void> {
  const { dataReferencia, equipePrevistaId, executadoPor } = params;

  // 1. Buscar slots da escala (previstos) para a equipe no dia
  const slots = await prisma.slotEscala.findMany({
    where: {
      data: { gte: dataRefInicio, lte: dataRefFim },
      escalaEquipePeriodo: { equipeId: equipePrevistaId },
    },
    include: {
      eletricista: { include: { Status: true } },
    },
  });

  // 2. Buscar turnos realmente abertos no dia (TODAS as equipes)
  const aberturasDia = await prisma.turnoRealizadoEletricista.findMany({
    where: {
      turnoRealizado: {
        dataReferencia: { gte: dataRefInicio, lte: dataRefFim },
      },
    },
    include: {
      turnoRealizado: { select: { equipeId: true } },
      eletricista: { include: { Status: true } },
    },
  });

  // 3. Agrupar aberturas por eletricista
  // 4. Processar cada slot da escala
  // 5. Processar turnos abertos SEM escala (extrafora)
}
```

---

### Passo a Passo da Lógica

#### Passo 1: Buscar Slots da Escala

```typescript
const slots = await prisma.slotEscala.findMany({
  where: {
    data: {
      gte: new Date(dataReferencia).setHours(0, 0, 0, 0),
      lte: new Date(dataReferencia).setHours(23, 59, 59, 999),
    },
    escalaEquipePeriodo: {
      equipeId: equipePrevistaId,
      // IMPORTANTE: Apenas escalas PUBLICADA são consideradas
      status: 'PUBLICADA', // ← Isso é verificado implicitamente
    },
  },
  include: {
    eletricista: {
      include: {
        Status: true, // Status atual do eletricista (FERIAS, LICENCA_MEDICA, etc.)
      },
    },
  },
});
```

**Importante**:

- Apenas escalas com `status = 'PUBLICADA'` são consideradas
- Escalas em `RASCUNHO` ou `EM_APROVACAO` são **ignoradas**

---

#### Passo 2: Buscar Turnos Realmente Abertos

```typescript
const aberturasDia = await prisma.turnoRealizadoEletricista.findMany({
  where: {
    turnoRealizado: {
      dataReferencia: {
        gte: dataRefInicio,
        lte: dataRefFim,
      },
    },
  },
  include: {
    turnoRealizado: {
      select: {
        equipeId: true, // Precisa saber em qual equipe abriu
      },
    },
    eletricista: {
      include: {
        Status: true,
      },
    },
  },
});
```

**Importante**:

- Busca turnos de **TODAS as equipes** (não apenas a equipe prevista)
- Isso permite detectar divergências (abriu em equipe diferente)

---

#### Passo 3: Agrupar Aberturas por Eletricista

```typescript
const abertosPorEletricista = new Map<
  number,
  {
    equipes: Set<number>; // Quais equipes este eletricista abriu turno
    itens: typeof aberturasDia; // Lista de aberturas
  }
>();

for (const abertura of aberturasDia) {
  const eletricistaId = abertura.eletricistaId;
  const existing = abertosPorEletricista.get(eletricistaId);
  if (existing) {
    existing.equipes.add(abertura.turnoRealizado.equipeId);
    existing.itens.push(abertura);
  } else {
    abertosPorEletricista.set(eletricistaId, {
      equipes: new Set([abertura.turnoRealizado.equipeId]),
      itens: [abertura],
    });
  }
}
```

**Objetivo**:

- Saber quais eletricistas abriram turno
- Saber em quais equipes cada eletricista abriu
- Permitir detectar divergências

---

#### Passo 4: Processar Cada Slot da Escala

Para cada slot da escala, verificar:

```typescript
for (const slot of slots) {
  const aberturasEletricista = abertosPorEletricista.get(slot.eletricistaId);
  const estadoSlot = slot.estado; // TRABALHO, FOLGA, FALTA, EXCECAO

  // Verificar status do eletricista
  const eletricistaStatus = slot.eletricista.Status?.status || 'ATIVO';
  const statusJustificaFalta = [
    'FERIAS',
    'LICENCA_MEDICA',
    'LICENCA_MATERNIDADE',
    'LICENCA_PATERNIDADE',
    'SUSPENSAO',
    'TREINAMENTO',
    'AFastADO',
    'DESLIGADO',
    'APOSENTADO',
  ].includes(eletricistaStatus);

  // Processar conforme estado do slot
  if (estadoSlot === 'TRABALHO') {
    // CASO 1: TRABALHO + ABRIU na mesma equipe → Normal
    // CASO 2: TRABALHO + NÃO ABRIU → Falta
    // CASO 3: TRABALHO + ABRIU em equipe diferente → Divergência
    // CASO 7: TRABALHO + ABRIU com atraso compensado → Hora Extra
  } else if (estadoSlot === 'FOLGA') {
    // CASO 4: FOLGA + ABRIU → Hora Extra (folga_trabalhada)
    // CASO 5: FOLGA + NÃO ABRIU → Normal (folga esperada)
  } else if (estadoSlot === 'EXCECAO' || estadoSlot === 'FALTA') {
    // Tratar similar ao TRABALHO
  }
}
```

---

#### Passo 5: Processar Turnos Abertos SEM Escala

```typescript
// CASO 6: Eletricista abriu turno SEM estar em nenhuma escala
for (const [eletricistaId, aberturas] of abertosPorEletricista.entries()) {
  // Verificar se este eletricista tinha algum slot na escala
  const tinhaSlotNaEscala = slots.some(s => s.eletricistaId === eletricistaId);

  if (!tinhaSlotNaEscala) {
    // Eletricista abriu turno sem estar na escala = trabalho extrafora
    for (const abertura of aberturas.itens) {
      // Criar HoraExtra tipo 'extrafora'
      await prisma.horaExtra.create({
        data: {
          dataReferencia: dataRef,
          eletricistaId,
          turnoRealizadoEletricistaId: abertura.id,
          tipo: 'extrafora',
          horasPrevistas: new Prisma.Decimal(0),
          horasRealizadas: new Prisma.Decimal(horasRealizadas),
          diferencaHoras: new Prisma.Decimal(horasRealizadas),
          status: 'pendente',
        },
      });
    }
  }
}
```

**Importante**:

- Este passo processa apenas eletricistas que **não tinham nenhum slot** na escala
- Se tinha slot de FOLGA, já foi processado no Passo 4 (cria `folga_trabalhada`)
- Se tinha slot de TRABALHO, já foi processado no Passo 4 (cria falta ou divergência)

---

## 📊 Casos de Uso Detalhados

### CASO 1: Escala TRABALHO + Eletricista ABRIU turno na mesma equipe

**Situação**:

- Escala: `SlotEscala` com `estado = 'TRABALHO'`, `eletricistaId = 123`, `equipeId = 1`
- Real: `TurnoRealizadoEletricista` com `eletricistaId = 123`, `turnoRealizado.equipeId = 1`

**Resultado**: ✅ **Normal**

- Não cria nenhum registro adicional
- Registro fica apenas em `TurnoRealizadoEletricista`
- Se houver atraso (>30min), pode criar `HoraExtra` tipo `atraso_compensado`

**Código**:

```typescript
if (estadoSlot === 'TRABALHO') {
  if (aberturasEletricista && aberturasEletricista.equipes.has(params.equipePrevistaId)) {
    // Verificar atraso (Caso 7)
    const aberturaNaEquipe = aberturasEletricista.itens.find(
      a => a.turnoRealizado.equipeId === params.equipePrevistaId
    );

    if (aberturaNaEquipe && slot.inicioPrevisto) {
      await this.processarAtraso(prisma, slot, aberturaNaEquipe, executadoPor);
    }
    // Caso normal, sem ação adicional
    continue;
  }
}
```

---

### CASO 2: Escala TRABALHO + Eletricista NÃO ABRIU turno

**Situação**:

- Escala: `SlotEscala` com `estado = 'TRABALHO'`, `eletricistaId = 123`, `equipeId = 1`
- Real: Nenhum `TurnoRealizadoEletricista` com `eletricistaId = 123` no dia

**Resultado**: ❌ **FALTA**

- Cria registro em `Falta`:
  - `motivoSistema`: `'falta_abertura'`
  - `status`: `'pendente'`
  - `escalaSlotId`: ID do slot da escala
  - `dataReferencia`: Data do slot
  - `equipeId`: Equipe da escala
  - `eletricistaId`: Eletricista escalado

**Exceções** (não cria falta):

- Eletricista tem status `FERIAS`, `LICENCA_MEDICA`, etc.
- Equipe tem justificativa aprovada que não gera falta (`JustificativaEquipe` com
  `status = 'aprovada'` e `tipoJustificativa.geraFalta = false`)

**Código**:

```typescript
// CASO 2: TRABALHO + NÃO ABRIU na equipe prevista
if (!aberturasEletricista || !aberturasEletricista.equipes.has(params.equipePrevistaId)) {
  // Verificar se abriu em OUTRA equipe primeiro (CASO 3)
  if (aberturasEletricista && aberturasEletricista.equipes.size > 0) {
    // Criar divergência, não falta
    continue;
  }

  // Verificar justificativa de equipe
  const justificativaEquipe = await prisma.justificativaEquipe.findUnique({
    where: {
      dataReferencia_equipeId: {
        dataReferencia: dataRef,
        equipeId: params.equipePrevistaId,
      },
    },
    include: {
      tipoJustificativa: true,
    },
  });

  if (
    justificativaEquipe &&
    justificativaEquipe.status === 'aprovada' &&
    !justificativaEquipe.tipoJustificativa.geraFalta
  ) {
    // Não criar falta
    continue;
  }

  // Não criar falta se status do eletricista justifica ausência
  if (!statusJustificaFalta) {
    await prisma.falta.create({
      data: {
        dataReferencia: dataRef,
        equipeId: params.equipePrevistaId,
        eletricistaId: slot.eletricistaId,
        escalaSlotId: slot.id,
        motivoSistema: 'falta_abertura',
        status: 'pendente',
        createdBy: 'system',
      },
    });
  }
}
```

---

### CASO 3: Escala TRABALHO + Eletricista ABRIU em EQUIPE DIFERENTE

**Situação**:

- Escala: `SlotEscala` com `estado = 'TRABALHO'`, `eletricistaId = 123`, `equipeId = 1`
- Real: `TurnoRealizadoEletricista` com `eletricistaId = 123`, `turnoRealizado.equipeId = 2`

**Resultado**: ⚠️ **DIVERGÊNCIA**

- Cria registro em `DivergenciaEscala`:
  - `tipo`: `'equipe_divergente'`
  - `equipePrevistaId`: Equipe da escala (1)
  - `equipeRealId`: Equipe onde realmente abriu (2)
  - `eletricistaId`: Eletricista (123)
- **NÃO cria falta** porque o eletricista trabalhou, apenas em equipe diferente

**Código**:

```typescript
// CASO 3: TRABALHO + ABRIU em EQUIPE DIFERENTE (Divergência)
if (aberturasEletricista && aberturasEletricista.equipes.size > 0) {
  const equipeRealId = [...aberturasEletricista.equipes][0];
  await prisma.divergenciaEscala.create({
    data: {
      dataReferencia: dataRef,
      equipePrevistaId: params.equipePrevistaId,
      equipeRealId,
      eletricistaId: slot.eletricistaId,
      tipo: 'equipe_divergente',
      detalhe: null,
      createdBy: params.executadoPor,
    },
  });
  // Não criar falta pois eletricista trabalhou em outra equipe
  continue;
}
```

---

### CASO 4: Escala FOLGA + Eletricista ABRIU turno

**Situação**:

- Escala: `SlotEscala` com `estado = 'FOLGA'`, `eletricistaId = 123`
- Real: `TurnoRealizadoEletricista` com `eletricistaId = 123`

**Resultado**: 💰 **HORA EXTRA (folga_trabalhada)**

- Cria registro em `HoraExtra`:
  - `tipo`: `'folga_trabalhada'`
  - `horasPrevistas`: 0 (folga)
  - `horasRealizadas`: Calculado de `abertoEm` até `fechadoEm`
  - `diferencaHoras`: `horasRealizadas` (já que previsto é 0)
  - `escalaSlotId`: ID do slot de folga
  - `status`: `'pendente'`

**Observação**: Permitir trabalho em folga (não bloquear), mas registrar como hora extra.

**Código**:

```typescript
// CASO 4: FOLGA + ABRIU (Hora Extra - folga_trabalhada)
if (estadoSlot === 'FOLGA') {
  if (aberturasEletricista && aberturasEletricista.itens.length > 0) {
    const abertura =
      aberturasEletricista.itens.find(a => a.turnoRealizado.equipeId === params.equipePrevistaId) ||
      aberturasEletricista.itens[0];

    const horasRealizadas = this.calcularHorasTrabalhadas(abertura.abertoEm, abertura.fechadoEm);

    await prisma.horaExtra.create({
      data: {
        dataReferencia: dataRef,
        eletricistaId: slot.eletricistaId,
        turnoRealizadoEletricistaId: abertura.id,
        escalaSlotId: slot.id,
        tipo: 'folga_trabalhada',
        horasPrevistas: new Prisma.Decimal(0),
        horasRealizadas: new Prisma.Decimal(horasRealizadas),
        diferencaHoras: new Prisma.Decimal(horasRealizadas),
        status: 'pendente',
        createdBy: params.executadoPor,
      },
    });
  }
  // CASO 5: FOLGA + NÃO ABRIU (Normal - sem ação)
}
```

---

### CASO 5: Escala FOLGA + Eletricista NÃO ABRIU turno

**Situação**:

- Escala: `SlotEscala` com `estado = 'FOLGA'`, `eletricistaId = 123`
- Real: Nenhum `TurnoRealizadoEletricista` com `eletricistaId = 123` no dia

**Resultado**: ✅ **Normal (folga)**

- Sem ação adicional
- Folga é esperada

---

### CASO 6: Sem Escala + Eletricista ABRIU turno

**Situação**:

- Escala: Nenhum `SlotEscala` para `eletricistaId = 123` no dia
- Real: `TurnoRealizadoEletricista` com `eletricistaId = 123`

**Resultado**: 💰 **HORA EXTRA (extrafora)**

- Cria registro em `HoraExtra`:
  - `tipo`: `'extrafora'`
  - `horasPrevistas`: 0 (sem escala)
  - `horasRealizadas`: Calculado de `abertoEm` até `fechadoEm`
  - `diferencaHoras`: `horasRealizadas`
  - `status`: `'pendente'`
  - `escalaSlotId`: NULL (não tem slot)

**Observação**: Trabalho fora da escala planejada.

**Código**:

```typescript
// CASO 6: Eletricista abriu turno SEM estar em nenhuma escala
for (const [eletricistaId, aberturas] of abertosPorEletricista.entries()) {
  // Verificar se este eletricista tinha algum slot na escala
  const tinhaSlotNaEscala = slots.some(s => s.eletricistaId === eletricistaId);

  if (!tinhaSlotNaEscala) {
    // Eletricista abriu turno sem estar na escala = trabalho extrafora
    for (const abertura of aberturas.itens) {
      const horasRealizadas = this.calcularHorasTrabalhadas(abertura.abertoEm, abertura.fechadoEm);

      await prisma.horaExtra.create({
        data: {
          dataReferencia: dataRef,
          eletricistaId,
          turnoRealizadoEletricistaId: abertura.id,
          tipo: 'extrafora',
          horasPrevistas: new Prisma.Decimal(0),
          horasRealizadas: new Prisma.Decimal(horasRealizadas),
          diferencaHoras: new Prisma.Decimal(horasRealizadas),
          status: 'pendente',
          createdBy: params.executadoPor,
        },
      });
    }
  }
}
```

---

### CASO 7: Escala TRABALHO + Eletricista ABRIU COM ATRASO

**Situação**:

- Escala: `SlotEscala` com `estado = 'TRABALHO'`, `inicioPrevisto = '08:00:00'`,
  `fimPrevisto = '17:00:00'`
- Real: `TurnoRealizadoEletricista` com `abertoEm = '09:00:00'` (1h atraso),
  `fechadoEm = '18:00:00'`

**Resultado**: ⏰ **Verificar compensação**

- Se `abertoEm > inicioPrevisto + 30min`:
  - Se `fechadoEm` compensou (trabalhou mais horas):
    - Criar `HoraExtra`:
      - `tipo`: `'atraso_compensado'`
      - `horasPrevistas`: 9.0 (calculado da escala: 17:00 - 08:00)
      - `horasRealizadas`: 9.0 (calculado do turno: 18:00 - 09:00)
      - `diferencaHoras`: 0.0 (compensou) ou positivo se trabalhou mais
      - `status`: `'pendente'`
  - Se não compensou:
    - Apenas logar (não cria falta parcial ainda)

**Margem de tolerância**: 30 minutos após `inicioPrevisto`.

**Código**:

```typescript
private async processarAtraso(
  prisma: PrismaTransactionClient,
  slot: any,
  abertura: any,
  executadoPor: string
): Promise<void> {
  if (!slot.inicioPrevisto) return;

  // Converter horário previsto para Date
  const [hora, minuto] = slot.inicioPrevisto.split(':').map(Number);
  const dataRef = new Date(slot.data);
  dataRef.setHours(hora, minuto, 0, 0);

  // Horário limite (previsto + 30 minutos)
  const horarioLimite = new Date(dataRef);
  horarioLimite.setMinutes(horarioLimite.getMinutes() + 30);

  // Verificar se houve atraso
  if (abertura.abertoEm > horarioLimite) {
    const horasPrevistas = this.calcularHorasPrevistas(slot);
    const horasRealizadas = this.calcularHorasTrabalhadas(
      abertura.abertoEm,
      abertura.fechadoEm
    );

    const diferenca = horasRealizadas - Number(horasPrevistas);
    const compensou = diferenca >= 0;

    if (compensou) {
      // Criar hora extra de atraso compensado
      await prisma.horaExtra.create({
        data: {
          dataReferencia: slot.data,
          eletricistaId: slot.eletricistaId,
          turnoRealizadoEletricistaId: abertura.id,
          escalaSlotId: slot.id,
          tipo: 'atraso_compensado',
          horasPrevistas: new Prisma.Decimal(horasPrevistas),
          horasRealizadas: new Prisma.Decimal(horasRealizadas),
          diferencaHoras: new Prisma.Decimal(diferenca),
          observacoes: `Atraso de ${Math.round(
            (abertura.abertoEm.getTime() - dataRef.getTime()) / 1000 / 60
          )} minutos compensado`,
          status: 'pendente',
          createdBy: executadoPor,
        },
      });
    }
  }
}
```

---

## 🔍 Problemas Potenciais

### 1. Escala não está PUBLICADA

**Problema**: Se a escala está em `RASCUNHO` ou `EM_APROVACAO`, ela **não é considerada** na
reconciliação.

**Como verificar**:

```sql
SELECT id, equipeId, periodoInicio, periodoFim, status
FROM EscalaEquipePeriodo
WHERE equipeId = ?
  AND periodoInicio <= ?
  AND periodoFim >= ?;
```

**Solução**: Publicar a escala (`status = 'PUBLICADA'`).

---

### 2. Reconciliação não está sendo executada

**Problema**: A reconciliação é **assíncrona** e pode falhar silenciosamente.

**Como verificar**:

- Verificar logs do sistema para erros de reconciliação
- Verificar se o job diário está executando (às 23h)
- Verificar se há erros no método `reconciliarDiaEquipe()`

**Solução**:

- Verificar logs: `this.logger.error('Erro na reconciliação:', error)`
- Executar reconciliação manual para testar

---

### 3. Turno não está sendo salvo corretamente

**Problema**: Se `TurnoRealizado` ou `TurnoRealizadoEletricista` não são salvos, a reconciliação não
tem dados para comparar.

**Como verificar**:

```sql
SELECT * FROM TurnoRealizado
WHERE dataReferencia = ? AND equipeId = ?;

SELECT * FROM TurnoRealizadoEletricista
WHERE turnoRealizadoId IN (
  SELECT id FROM TurnoRealizado
  WHERE dataReferencia = ? AND equipeId = ?
);
```

**Solução**: Verificar se a abertura de turno está funcionando corretamente.

---

### 4. Data de referência incorreta

**Problema**: Se `dataReferencia` do turno não corresponde à data do slot da escala, não será
encontrado.

**Como verificar**:

```sql
-- Verificar slots da escala
SELECT id, eletricistaId, data, estado
FROM SlotEscala
WHERE escalaEquipePeriodoId = ?
  AND data = ?;

-- Verificar turnos abertos
SELECT id, dataReferencia, equipeId
FROM TurnoRealizado
WHERE dataReferencia = ? AND equipeId = ?;
```

**Solução**: Garantir que `dataReferencia` está no formato correto (apenas data, sem hora).

---

### 5. Eletricista não está na escala

**Problema**: Se o eletricista não tem slot na escala, não será processado no Passo 4, apenas no
Passo 5 (extrafora).

**Como verificar**:

```sql
SELECT * FROM SlotEscala
WHERE eletricistaId = ?
  AND data = ?
  AND escalaEquipePeriodo.status = 'PUBLICADA';
```

**Solução**: Verificar se o eletricista está escalado corretamente.

---

### 6. Erro de constraint única (idempotência)

**Problema**: Se tentar criar registro duplicado, pode falhar silenciosamente.

**Como verificar**:

- Verificar logs para erros `P2002` (duplicata)
- Verificar constraints únicas nas tabelas

**Solução**: O código já trata isso com `.catch()` ignorando erros `P2002`:

```typescript
.catch((err: any) => {
  if (err.code !== 'P2002') {
    this.logger.warn(`Erro ao criar falta: ${err.message}`);
  }
});
```

---

### 7. Job diário não está executando

**Problema**: Se o job diário não está executando, dias antigos não são reconciliados.

**Como verificar**:

- Verificar logs do scheduler às 23h
- Verificar se `ScheduleModule` está importado no `AppModule`
- Verificar se o cron está configurado corretamente

**Solução**:

- Verificar configuração do `ScheduleModule`
- Executar reconciliação manual para testar

---

### 8. Margem de 30 minutos impedindo reconciliação

**Problema**: O job diário aguarda 30 minutos após `inicioPrevisto` antes de reconciliar.

**Como verificar**:

```typescript
// No scheduler, verifica se já passou a margem
const horarioLimite = new Date(horarioPrevisto);
horarioLimite.setMinutes(horarioLimite.getMinutes() + 30);

if (agora < horarioLimite) {
  podeReconciliar = false;
}
```

**Solução**:

- A reconciliação imediata após abertura não tem essa restrição
- O job diário só processa dias que já passaram da margem

---

## 📝 Resumo: Quando NÃO tem Escala Cadastrada

### Cenário: Eletricista trabalhou mas não tem escala cadastrada

**O que acontece**:

1. Não há `SlotEscala` para este eletricista neste dia
2. O Passo 4 (processar slots da escala) não encontra nada
3. O Passo 5 (processar turnos sem escala) detecta que o eletricista abriu turno
4. Cria `HoraExtra` tipo `'extrafora'`

**Resultado**:

- ✅ `TurnoRealizado` e `TurnoRealizadoEletricista` são salvos normalmente
- ✅ `HoraExtra` tipo `'extrafora'` é criada
- ❌ **NÃO** aparece como "dia trabalhado fora escala" (isso seria apenas uma visualização)
- ✅ Aparece como hora extra pendente de aprovação

**Observação**:

- Se você quer que apareça como "dia trabalhado fora escala" mas **não como hora extra**, seria
  necessário:
  1. Criar uma nova tabela ou campo para isso
  2. Ou usar um tipo diferente de `HoraExtra` com status especial
  3. Ou criar uma visualização/relatório que diferencia `extrafora` de outras horas extras

---

## 🔧 Como Debugar

### 1. Verificar se turno foi salvo

```sql
SELECT * FROM TurnoRealizado
WHERE dataReferencia = '2024-01-15' AND equipeId = 1;

SELECT tre.*, tr.equipeId, tr.dataReferencia
FROM TurnoRealizadoEletricista tre
JOIN TurnoRealizado tr ON tre.turnoRealizadoId = tr.id
WHERE tr.dataReferencia = '2024-01-15' AND tr.equipeId = 1;
```

### 2. Verificar se escala existe e está publicada

```sql
SELECT eep.*, COUNT(se.id) as total_slots
FROM EscalaEquipePeriodo eep
LEFT JOIN SlotEscala se ON se.escalaEquipePeriodoId = eep.id
WHERE eep.equipeId = 1
  AND eep.periodoInicio <= '2024-01-15'
  AND eep.periodoFim >= '2024-01-15'
GROUP BY eep.id;
```

### 3. Verificar slots da escala

```sql
SELECT se.*, e.nome as eletricista_nome
FROM SlotEscala se
JOIN EscalaEquipePeriodo eep ON se.escalaEquipePeriodoId = eep.id
JOIN Eletricista e ON se.eletricistaId = e.id
WHERE eep.equipeId = 1
  AND se.data = '2024-01-15'
  AND eep.status = 'PUBLICADA';
```

### 4. Verificar faltas criadas

```sql
SELECT f.*, e.nome as eletricista_nome
FROM Falta f
JOIN Eletricista e ON f.eletricistaId = e.id
WHERE f.dataReferencia = '2024-01-15' AND f.equipeId = 1;
```

### 5. Verificar horas extras criadas

```sql
SELECT he.*, e.nome as eletricista_nome
FROM HoraExtra he
JOIN Eletricista e ON he.eletricistaId = e.id
WHERE he.dataReferencia = '2024-01-15';
```

### 6. Verificar divergências criadas

```sql
SELECT d.*, e.nome as eletricista_nome
FROM DivergenciaEscala d
JOIN Eletricista e ON d.eletricistaId = e.id
WHERE d.dataReferencia = '2024-01-15';
```

---

## 📌 Conclusão

O sistema de reconciliação funciona comparando:

1. **Escala planejada** (`SlotEscala` com `EscalaEquipePeriodo.status = 'PUBLICADA'`)
2. **Turnos realmente executados** (`TurnoRealizado` e `TurnoRealizadoEletricista`)

E gera automaticamente:

- **Faltas** quando escalado não abriu
- **Divergências** quando abriu em equipe diferente
- **Horas Extras** quando trabalhou em folga, extrafora, ou compensou atraso

**Pontos críticos**:

- Escala deve estar `PUBLICADA` para ser considerada
- Reconciliação é assíncrona e pode falhar silenciosamente
- Turnos sem escala geram `HoraExtra` tipo `extrafora`
- Job diário às 23h processa dias pendentes

**Para debugar problemas**:

1. Verificar se turno foi salvo
2. Verificar se escala existe e está publicada
3. Verificar logs de erro da reconciliação
4. Executar reconciliação manual para testar
