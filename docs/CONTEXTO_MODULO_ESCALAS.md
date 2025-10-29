# 📋 Contexto do Módulo de Escalas - Nexa Oper

## 🎯 Visão Geral

Sistema de gestão de escalas de trabalho para equipes de eletricistas, controlando padrões de
trabalho/folga e alocação de profissionais ao longo do tempo.

---

## 🏗️ Arquitetura Atual

### 1. **TipoEscala** (Catálogo de Padrões)

Define PADRÕES de trabalho/folga (ex: 4x2, 5x1, Espanhola).

```typescript
TipoEscala {
  id: number
  nome: string                    // "4x2", "Espanhola", etc
  modoRepeticao: CICLO_DIAS | SEMANA_DEPENDENTE
  cicloDias?: number             // Ex: 6 (para 4x2)
  periodicidadeSemanas?: number  // Ex: 2 (para Espanhola)
  eletricistasPorTurma: number   // Quantos trabalham por dia
  ativo: boolean

  // Relacionamentos:
  CicloPosicoes[]                // Se CICLO_DIAS
  SemanaMascaras[]               // Se SEMANA_DEPENDENTE
}
```

**Dois modos:**

**A) CICLO_DIAS** (Ex: 4x2)

- Define um ciclo que se repete
- `CicloPosicoes`: array de posições (0 a N)
- Cada posição: TRABALHO ou FOLGA

```bash
Exemplo 4x2 (6 dias de ciclo):
Posição 0: TRABALHO
Posição 1: TRABALHO
Posição 2: TRABALHO
Posição 3: TRABALHO
Posição 4: FOLGA
Posição 5: FOLGA
[repete...]
```

**B) SEMANA_DEPENDENTE** (Ex: Espanhola)

- Define padrão por semana do mês
- `SemanaMascaras`: array de (semanaIndex, dia, status)

```bash
Exemplo Espanhola (2 semanas):
Semana 0: Segunda-Domingo = TRABALHO
Semana 1: Segunda-Sexta = TRABALHO, Sáb-Dom = FOLGA
[repete...]
```

### 2. **Equipe**

Grupo de eletricistas que trabalham juntos.

```typescript
Equipe {
  id: number
  nome: string
  ativo: boolean

  // Relacionamentos:
  Membros[]                      // Eletricistas da equipe
  EscalasEquipePeriodo[]         // Escalas aplicadas
}
```

### 3. **Eletricista**

Profissional que compõe as equipes.

```typescript
Eletricista {
  id: number
  nome: string
  matricula: string
  equipeId?: number
  ativo: boolean
}
```

### 4. **EscalaEquipePeriodo** (Escala Real/Aplicada)

Aplica um TipoEscala para uma Equipe em um período específico.

```typescript
EscalaEquipePeriodo {
  id: number
  equipeId: number
  tipoEscalaId: number
  periodoInicio: Date
  periodoFim: Date
  status: RASCUNHO | EM_APROVACAO | PUBLICADA | ARQUIVADA
  versao: number

  // Relacionamentos:
  Slots[]                        // Slots gerados para cada dia/eletricista
}
```

**Ciclo de vida:**

1. **RASCUNHO**: criação, pode editar, gerar slots
2. **PUBLICADA**: oficial, imutável, eletricistas veem
3. **ARQUIVADA**: período finalizado, apenas histórico

### 5. **SlotEscala** (Dia + Eletricista)

Representa o estado de UM eletricista em UM dia específico.

```typescript
SlotEscala {
  id: number
  escalaEquipePeriodoId: number
  eletricistaId: number
  data: Date
  estado: TRABALHO | FOLGA | FALTA | EXCECAO

  // Horários previstos (herdados da equipe):
  inicioPrevisto?: string        // "08:00:00"
  fimPrevisto?: string           // "17:00:00"

  anotacoesDia?: string
  origem: GERACAO | MANUAL | REMANEJAMENTO

  // Relacionamentos:
  eletricista: Eletricista
  Coberturas[]                   // Eventos de falta/troca
}
```

**Chave única:** `(escalaEquipePeriodoId, data, eletricistaId)`

---

## 🔄 Fluxo de Funcionamento

### Criação de Escala (Wizard - 3 Steps)

***Step 1: Configuração**

```bash
- Selecionar Equipe
- Selecionar TipoEscala (4x2, Espanhola, etc)
- Definir Período (01/10 a 31/10)
```

***Step 2: Eletricistas**

```bash
- Selecionar quais eletricistas participarão
- Definir "primeiro dia de folga" de cada um
  (para desencontrar as folgas entre eles)
```

***Step 3: Gerar Slots**

```bash
- Sistema cria todos os Slots automaticamente
- Para cada dia do período:
  - Para cada eletricista selecionado:
    - Calcula se é TRABALHO ou FOLGA
    - Atribui horários (se TRABALHO)
```

### Algoritmo de Geração

```typescript
Para cada eletricista:
  posicaoInicial = calcularPosicaoBaseadoNaPrimeiraFolga(primeiroDiaFolga)

  Para cada dia (0 até totalDias):
    posicaoAtual = (posicaoInicial + diaIndex) % cicloDias

    // Busca configuração do TipoEscala
    if (tipoEscala.CicloPosicoes[posicaoAtual].status === 'TRABALHO')
      estado = TRABALHO
      // Atribui horários da equipe
    else
      estado = FOLGA

    // Cria Slot
    salvar(eletricistaId, data, estado, horarios)
```

**Exemplo prático:**

```bash
TipoEscala 4x2: T T T T F F
Período: 01/10 a 10/10

Eletricista A (primeira folga dia 0):
01/10: FOLGA ← começa aqui
02/10: FOLGA
03/10: TRABALHO 08:00-17:00
04/10: TRABALHO 08:00-17:00
...

Eletricista B (primeira folga dia 2):
01/10: TRABALHO 08:00-17:00
02/10: TRABALHO 08:00-17:00
03/10: FOLGA ← começa aqui
04/10: FOLGA
...
```

---

## ⏰ Horários das Equipes (A IMPLEMENTAR)

### Problema Atual

- Os slots têm `inicioPrevisto` e `fimPrevisto`
- Mas não temos de onde esses horários vêm!
- Precisamos gerenciar horários por equipe

### Entidade Necessária: EquipeHorarioVigencia

**Já existe no schema Prisma:**

```prisma
model EquipeHorarioVigencia {
  id              Int       @id @default(autoincrement())
  equipeId        Int
  equipe          Equipe    @relation(fields: [equipeId], references: [id])

  inicioTurnoHora String    @db.VarChar(8)    // "08:00:00"
  duracaoHoras    Decimal   @db.Decimal(5, 2) // 8.00, 12.00

  vigenciaInicio  DateTime
  vigenciaFim     DateTime?

  // Campos padrão
  createdAt       DateTime  @default(now())
  createdBy       String    @db.VarChar(255)
  updatedAt       DateTime? @updatedAt
  updatedBy       String?   @db.VarChar(255)
  deletedAt       DateTime?
  deletedBy       String?   @db.VarChar(255)
}
```

### Como deve funcionar

```typescript
// 1. Equipe pode ter múltiplas vigências (histórico de mudanças)
EquipeHorarioVigencia {
  equipeId: 1
  inicioTurnoHora: "08:00:00"
  duracaoHoras: 8.00
  vigenciaInicio: 2025-01-01
  vigenciaFim: 2025-06-30
}

EquipeHorarioVigencia {
  equipeId: 1
  inicioTurnoHora: "07:00:00"
  duracaoHoras: 9.00
  vigenciaInicio: 2025-07-01
  vigenciaFim: null  // Atual
}

// 2. Ao gerar slots, buscar horário vigente naquela data
function buscarHorarioVigente(equipeId, data) {
  return EquipeHorarioVigencia.where({
    equipeId,
    vigenciaInicio <= data,
    OR: [
      vigenciaFim >= data,
      vigenciaFim IS NULL
    ]
  })
}

// 3. Aplicar ao slot
slot.inicioPrevisto = vigencia.inicioTurnoHora
slot.fimPrevisto = calcularFim(inicio, duracao)
```

### Exemplo Real

```bash
Equipe "Manutenção A":
- 01/01/2025 a 30/06/2025: 08:00 por 8h (fim: 16:00)
- 01/07/2025 em diante:    07:00 por 9h (fim: 16:00)

Ao gerar escala de 15/06 a 15/07:
- Slots até 30/06: 08:00-16:00
- Slots de 01/07: 07:00-16:00
```

---

## 📊 Estrutura de Dados Resumida

```bash
TipoEscala (padrão)
  ├─ CicloPosicoes[] (se CICLO_DIAS)
  └─ SemanaMascaras[] (se SEMANA_DEPENDENTE)

Equipe
  ├─ Eletricistas[]
  ├─ EquipeHorarioVigencia[] ← A IMPLEMENTAR
  └─ EscalasEquipePeriodo[]
       └─ Slots[]
            ├─ eletricistaId
            ├─ data
            ├─ estado (TRABALHO/FOLGA/FALTA)
            ├─ inicioPrevisto ← vem de EquipeHorarioVigencia
            └─ fimPrevisto    ← calculado
```

---

## ✅ O que já está implementado

✅ CRUD de TipoEscala (criar padrões 4x2, Espanhola, etc) ✅ Configuração visual de ciclos e
máscaras ✅ CRUD de Equipes ✅ CRUD de Eletricistas ✅ Wizard de criação de escalas (3 steps) ✅
Geração automática de slots ✅ Visualização de escalas (grid mensal) ✅ Publicação de escalas ✅
Estados: RASCUNHO → PUBLICADA → ARQUIVADA

---

## ❌ O que precisa ser implementado

❌ CRUD de EquipeHorarioVigencia (gerenciar horários) ❌ Interface para definir horários das equipes
❌ Lógica para buscar horário vigente na data ❌ Integração com geração de slots ❌ Validação de
sobreposição de vigências ❌ Histórico de mudanças de horário

---

## 🎯 Objetivo Atual

**Implementar o módulo de EquipeHorarioVigencia:**

1. Permitir cadastrar horários para uma equipe
2. Suportar múltiplas vigências (histórico)
3. Calcular horário correto baseado na data
4. Aplicar automaticamente aos slots gerados

**Fluxo desejado:**

```bash
Gestor → Configura horário da equipe (08:00, 8h)
Sistema → Armazena em EquipeHorarioVigencia
Gestor → Cria escala para a equipe
Sistema → Gera slots com horários corretos (08:00-16:00)
```

---

## 📝 Notas Importantes

- **Slots são imutáveis após PUBLICAÇÃO**: garantir que horários estejam corretos antes
- **Vigências não podem sobrepor**: validar ao criar
- **Sempre ter uma vigência ativa**: vigenciaFim = null
- **Histórico completo**: nunca deletar, apenas inativar
- **Cálculo de fim**: `fim = inicio + duracaoHoras` (considerar formato HH:MM:SS)

---

## 🔗 Arquivos Principais

```bash
Frontend:
- apps/web/src/app/dashboard/cadastro/tipo-escala/         # CRUD TipoEscala
- apps/web/src/app/dashboard/cadastro/escala-equipe-periodo/ # CRUD Escalas
- apps/web/src/lib/actions/escala/                         # Server Actions
- apps/web/src/lib/services/escala/                        # Business Logic
- apps/web/src/lib/schemas/escalaSchemas.ts                # Validações

Backend Schema:
- packages/db/prisma/models/escala.prisma                  # Modelos Prisma
```

---

## 💡 Dicas para Implementação

1. **Seguir o padrão existente**: ver TipoEscalaService como referência
2. **Usar AbstractCrudService**: herdar funcionalidades básicas
3. **Validar com Zod**: criar schemas em escalaSchemas.ts
4. **Server Actions**: criar em actions/escala/
5. **Interface visual**: seguir padrão Ant Design usado no projeto
6. **Sempre usar soft delete**: deletedAt/deletedBy

---

