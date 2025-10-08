# 📅 Lógica do Sistema de Escalas

## Conceitos Fundamentais

### 1. Estrutura da Escala

```bash
EscalaEquipePeriodo (Período da Escala)
  └── SlotEscala (Cada DIA do período)
      └── AtribuicaoEletricista (Eletricistas trabalhando naquele dia)
```

### 2. Sistema Flexível de Escalas

**Conceito:** Cada tipo de escala define quantos eletricistas são necessários!

#### Exemplos de Configuração:

**Escala 4x2 (3 eletricistas):**
```
Ciclo: 6 dias (4 trabalho + 2 folga)
Eletricistas: 3 em ciclos defasados
Cobertura: Sempre 2 por turno
```

**Escala Espanhola (2 eletricistas):**
```
Ciclo: 2 semanas
Eletricistas: 2 sempre juntos
Cobertura: 2 em todos os dias de trabalho, 0 no domingo da semana B
```

**Escala Espanhola Premium (4 eletricistas):**
```
Ciclo: 2 semanas
Eletricistas: 4 sempre juntos
Cobertura: 4 em todos os dias de trabalho
```

**Escala 4x1 (5 eletricistas):**
```
Ciclo: 5 dias (4 trabalho + 1 folga)
Eletricistas: 5 em ciclos defasados
Cobertura: Sempre 4 por turno
```

#### Exemplo Visual 4x2 com 3 Eletricistas:

```
Legenda: T = Trabalho, F = Folga

Dia:         1  2  3  4  5  6  7  8  9 10 11 12 13 14
Eletricista A: T  T  T  T  F  F  T  T  T  T  F  F  T  T
Eletricista B: T  T  F  F  T  T  T  T  F  F  T  T  T  T
Eletricista C: F  F  T  T  T  T  F  F  T  T  T  T  F  F
             ─────────────────────────────────────────────
Trabalhando:   2  2  2  2  2  2  2  2  2  2  2  2  2  2  ✅
```

**Vantagem:** Você define no cadastro do Tipo de Escala quantos eletricistas precisam!

### 3. O que é cada entidade?

#### **EscalaEquipePeriodo**

- Representa um PERÍODO de tempo (ex: Janeiro/2025)
- Vincula uma EQUIPE a um TIPO DE ESCALA (4x2, 5x1, etc)
- Status: RASCUNHO → PUBLICADA → ARQUIVADA

#### **SlotEscala**

- Representa um **DIA ESPECÍFICO** (ex: 15/01/2025)
- Indica se aquele dia é de TRABALHO ou FOLGA para a equipe
- Contém horários previstos (início e fim do turno)

#### **AtribuicaoEletricista**

- **Vincula um ELETRICISTA a um SLOT**
- Define QUEM trabalha naquele dia específico
- Cada slot tem 2 atribuições (2 eletricistas)

### 4. Fluxo de Criação da Escala

```
1. Criar EscalaEquipePeriodo
   ├── Escolher Equipe
   ├── Escolher Tipo de Escala (4x2)
   └── Definir Período (01/01 a 31/01)

2. Gerar Slots
   ├── Sistema cria 31 slots (um por dia)
   ├── Cada slot marcado como TRABALHO ou FOLGA
   └── Baseado no padrão do TipoEscala

3. Atribuir Eletricistas
   ├── Para cada slot de TRABALHO
   ├── Atribuir 2 eletricistas
   └── Seguindo ciclos defasados de cada um
```

### 5. Cálculo dos Ciclos Baseado na Próxima Folga

Para **Escala 4x2** com **3 eletricistas**:

**Como Funciona:**
1. Você informa a **data da próxima folga** de cada eletricista
2. O sistema calcula o ciclo a partir dessa data
3. Ciclo 4x2 = 6 dias (2 folga + 4 trabalho)

**Exemplo:**
```
Período: 01/01 a 31/01
Eletricista A: próxima folga 05/01
  → Trabalha: 01-04, 07-10, 13-16, 19-22, 25-28
  → Folga: 05-06, 11-12, 17-18, 23-24, 29-30

Eletricista B: próxima folga 03/01
  → Trabalha: 01-02, 05-08, 11-14, 17-20, 23-26, 29-31
  → Folga: 03-04, 09-10, 15-16, 21-22, 27-28

Eletricista C: próxima folga 07/01
  → Trabalha: 01-06, 09-12, 15-18, 21-24, 27-30
  → Folga: 07-08, 13-14, 19-20, 25-26, 31
```

**Vantagens:**
- ✅ Respeita a folga atual de cada eletricista
- ✅ Flexível para qualquer configuração
- ✅ Não precisa de defasagens pré-definidas

### 6. Matemática da Cobertura (Exemplos)

**Escala 4x2 (3 eletricistas):**
- Ciclo: 6 dias (4T + 2F)
- 3 eletricistas × 4 dias = 12 dias de trabalho por ciclo
- 6 dias × 2 por turno = 12 dias ✅ Perfeito!

**Escala 4x1 (5 eletricistas):**
- Ciclo: 5 dias (4T + 1F)
- 5 eletricistas × 4 dias = 20 dias de trabalho por ciclo
- 5 dias × 4 por turno = 20 dias ✅ Perfeito!

**Escala Espanhola (2 ou 4 eletricistas):**
- Não há cálculo - trabalham sempre juntos
- Quantidade = quantos você precisa no turno

## Terminologia Correta

❌ **Errado:** "Slot do eletricista" ✅ **Correto:** "Slot da escala onde o eletricista está
atribuído"

❌ **Errado:** "Escala individual" ✅ **Correto:** "Ciclo de trabalho/folga do eletricista"

❌ **Errado:** "Criar slot para cada eletricista" ✅ **Correto:** "Atribuir eletricistas aos slots
da escala"

## Resumo Visual

```
┌──────────────────────────────────────────┐
│   EscalaEquipePeriodo (Janeiro 2025)     │
│   Equipe: Alpha | Tipo: 4x2              │
└───────────────┬──────────────────────────┘
                │
                ├── Slot 01/01/2025 (TRABALHO)
                │   ├── Atribuição: Eletricista A
                │   └── Atribuição: Eletricista B
                │
                ├── Slot 02/01/2025 (TRABALHO)
                │   ├── Atribuição: Eletricista A
                │   └── Atribuição: Eletricista B
                │
                ├── Slot 03/01/2025 (TRABALHO)
                │   ├── Atribuição: Eletricista B
                │   └── Atribuição: Eletricista C
                │
                └── ... (continua)
```

## Implementação Atual

### ✅ Funcionalidades Implementadas

1. **Gerar Slots** ✅
   - Cria um slot para cada dia do período
   - Marca como TRABALHO ou FOLGA baseado no TipoEscala

2. **Atribuição Automática de Eletricistas** ✅
   - **Escala 4x2**: Atribui 3 eletricistas com ciclos defasados
   - **Escala Espanhola**: Atribui 2 eletricistas sempre juntos
   - Valida quantidade de eletricistas correta por tipo
   - Remove atribuições antigas antes de criar novas

### Como Usar na Interface - WIZARD GUIADO ⭐

Acessar "Cadastro > Escalas > Períodos de Escala" → Clicar em **"Novo Período (Guiado)"**

#### **Step 1: Configurações Básicas** 📋
- Selecionar **Equipe**
- Selecionar **Tipo de Escala** (4x2, Espanhola, etc)
- Sistema mostra automaticamente quantos eletricistas são necessários
- Definir **Período** (data início e fim)
- Adicionar observações (opcional)
- Clicar **"Próximo"** → Sistema salva o período

#### **Step 2: Atribuir Eletricistas** 👥
O wizard ajusta automaticamente baseado no tipo de escala:

**Se Escala 4x2 (Ciclo):**
- Selecionar **3 eletricistas** (limite automático)
- Para cada um, informar **data da próxima folga**
- Sistema valida que as datas estão dentro do período
- Clicar **"Próximo"** → Sistema cria atribuições com ciclos defasados

**Se Escala Espanhola (Semanal):**
- Selecionar **2 eletricistas** (limite automático)
- Não precisa informar datas (trabalham sempre juntos)
- Clicar **"Próximo"** → Sistema cria atribuições juntas

#### **Step 3: Gerar Slots** 📅
- Mostra resumo do que foi feito
- Clicar **"Gerar Slots e Finalizar"**
- Sistema cria todos os slots (dias) do período
- Escala completa criada! ✅

### Fluxo Alternativo - Manual (para escalas existentes)

Para escalas já criadas, você pode usar os botões individuais:
- 📅 **Gerar Slots** - Criar/recriar slots
- 👥 **Atribuir Eletricistas** - Atribuir/reatribuir eletricistas
- ✓ **Publicar** - Tornar imutável
- 📁 **Arquivar** - Arquivar escala publicada

### Como Usar via Código

```typescript
// 1. Criar período de escala
const periodo = await createEscalaEquipePeriodo({
  equipeId: 1,
  tipoEscalaId: 2, // 4x2
  periodoInicio: new Date('2025-01-01'),
  periodoFim: new Date('2025-01-31'),
});

// 2. Gerar slots (dias)
await gerarSlotsEscala({
  escalaEquipePeriodoId: periodo.id,
  mode: 'full',
});

// 3. Atribuir eletricistas
await atribuirEletricistas({
  escalaEquipePeriodoId: periodo.id,
  eletricistaIds: [1, 2, 3], // 3 para escala 4x2, 2 para Espanhola
});
```

## Próximos Passos

1. ✅ Gerar slots
2. ✅ Implementar atribuição automática de eletricistas
3. ✅ Interface para selecionar e atribuir eletricistas
4. 🔨 Interface para visualizar escalas geradas (calendário/grade)
5. 🔨 Permitir ajustes manuais de atribuições
6. 🔨 Validar composição antes de publicar
7. 🔨 Permitir trocas/remanejamentos
8. 🔨 Relatórios e exportação

---

**Documentação criada em:** 2025-01-08
**Última atualização:** 2025-01-08 (Interface de atribuição implementada)
