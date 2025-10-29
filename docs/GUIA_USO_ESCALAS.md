# 📖 Guia de Uso - Módulo de Escalas

## 🎯 Como Configurar as Posições/Máscaras

### 1️⃣ **Criar Tipo de Escala**

Acesse: `Cadastro → Escalas → Tipos de Escala`

**Exemplo - Criar 4x2:**
```
Nome: 4x2
Modo: Ciclo de Dias
Dias no Ciclo: 6
Mínimo de Eletricistas: 3
Ativo: Sim
```

Clique em **Salvar**.

---

### 2️⃣ **Configurar Posições do Ciclo** ⭐

Na tabela de Tipos de Escala, clique no botão **⚙️ Configurar** do tipo que criou.

Você verá a página de configuração com:

#### **Aba: "Configurar Ciclo"**

Mostra os 6 dias do ciclo (para 4x2):

```
Dia 1: TRABALHO  [Switch]  ← Clique para alternar T/F
Dia 2: TRABALHO  [Switch]
Dia 3: TRABALHO  [Switch]
Dia 4: TRABALHO  [Switch]
Dia 5: FOLGA     [Switch]
Dia 6: FOLGA     [Switch]
```

**Como configurar:**
- ✅ Use os **switches** para alternar entre TRABALHO e FOLGA
- ✅ Veja o **preview** do ciclo em tempo real
- ✅ Clique em **Salvar Configurações**

**Exemplo de configurações:**

**4x2 clássico:**
```
D1: T, D2: T, D3: T, D4: T, D5: F, D6: F
```

**5x1:**
```
D1: T, D2: T, D3: T, D4: T, D5: T, D6: F
```

---

### 3️⃣ **Configurar Máscaras de Semana** (Espanhola)

Para tipos com `Modo: Semana Dependente`:

**Criar tipo Espanhola:**
```
Nome: Espanhola
Modo: Semana Dependente
Periodicidade: 2 semanas
Mínimo: 2 eletricistas
```

Na página de **Configurar**, aba **"Configurar Semanas"**:

```
Semana A:
  Segunda: T, Terça: T, Quarta: T, Quinta: T, Sexta: T, Sábado: T, Domingo: T

Semana B:
  Segunda: T, Terça: T, Quarta: T, Quinta: T, Sexta: T, Sábado: F, Domingo: F
```

Clique nos dias para alternar T/F (em breve).

---

## 🚀 Como Usar Depois de Configurado

### 4️⃣ **Criar Período de Escala**

Acesse: `Cadastro → Escalas → Períodos de Escala`

```
Equipe: Equipe Aparecida
Tipo de Escala: 4x2 (que você configurou)
Período: 01/01/2025 até 31/01/2025
Observações: Escala de Janeiro
```

Clique em **Salvar**.

---

### 5️⃣ **Gerar Slots** ⭐ (Automático!)

Na tabela, clique no botão **📅** (Gerar Slots).

O sistema vai:
1. ✅ Criar 31 slots (um para cada dia do mês)
2. ✅ Aplicar o padrão do ciclo (4 trabalho, 2 folga, repete...)
3. ✅ Calcular horários de cada turno
4. ✅ Mostrar mensagem: "31 slots gerados com sucesso!"

---

### 6️⃣ **Publicar Escala**

Quando estiver tudo OK, clique no botão **✅** (Publicar).

A escala fica **imutável** (não pode mais editar).

---

## 📍 Fluxo Completo

```
1. Criar Papéis de Equipe (Líder, Motorista, Montador)
   ↓
2. Criar Tipos de Escala (4x2, 5x1, Espanhola)
   ↓
3. Configurar Posições/Máscaras (⚙️ botão Configurar)
   ↓
4. Criar Período de Escala (equipe + tipo + datas)
   ↓
5. Gerar Slots (📅 automático!)
   ↓
6. [Futuro] Atribuir Eletricistas
   ↓
7. Publicar (✅ torna imutável)
```

---

## 🎨 Visual da Página de Configuração

Quando você clicar em **⚙️ Configurar**:

```
┌─────────────────────────────────────────────┐
│ ← Voltar          4x2                       │
│                   [Ciclo de Dias]           │
│                          [Salvar Configurações] │
├─────────────────────────────────────────────┤
│  [Informações Gerais] [Configurar Ciclo (6 dias)] │
├─────────────────────────────────────────────┤
│                                             │
│  Dia 1  [TRABALHO]  ──────  [Switch ON]   │
│  Dia 2  [TRABALHO]  ──────  [Switch ON]   │
│  Dia 3  [TRABALHO]  ──────  [Switch ON]   │
│  Dia 4  [TRABALHO]  ──────  [Switch ON]   │
│  Dia 5  [FOLGA]     ──────  [Switch OFF]  │
│  Dia 6  [FOLGA]     ──────  [Switch OFF]  │
│                                             │
│  Preview: [D1:T] [D2:T] [D3:T] [D4:T] [D5:F] [D6:F] │
│                                             │
└─────────────────────────────────────────────┘
```

---

## 🔧 Status da Implementação

### ✅ **FUNCIONA AGORA:**
- ✅ Visualizar posições/máscaras
- ✅ Alternar posições localmente (no estado)
- ✅ Preview visual do ciclo
- ✅ Interface completa

### ⚠️ **FALTA IMPLEMENTAR:**
- ❌ Salvar posições no banco (botão "Salvar" está stub)
- ❌ Actions para criar/atualizar TipoEscalaCicloPosicao
- ❌ Actions para criar/atualizar TipoEscalaSemanaMascara

### 📋 **Para completar:**

Você pode:

**Opção 1 - Usar como está (stub):**
- Cria tipo de escala
- Configura visualmente as posições
- **Não salva** (ainda), mas a geração de slots funciona com padrão default

**Opção 2 - Completar o salvamento:**
- Criar actions para salvar posições/máscaras
- Integrar no botão "Salvar Configurações"
- Persistir no banco

---

## 💡 Workaround Temporário

Enquanto o salvamento não estiver implementado, você pode criar as posições manualmente no banco:

```sql
-- Exemplo: Configurar 4x2 (tipo_id = 1)
INSERT INTO TipoEscalaCicloPosicao (tipoEscalaId, posicao, status, createdBy, createdAt)
VALUES
  (1, 0, 'TRABALHO', 'admin', NOW()),
  (1, 1, 'TRABALHO', 'admin', NOW()),
  (1, 2, 'TRABALHO', 'admin', NOW()),
  (1, 3, 'TRABALHO', 'admin', NOW()),
  (1, 4, 'FOLGA', 'admin', NOW()),
  (1, 5, 'FOLGA', 'admin', NOW());
```

Depois, ao gerar slots, o sistema vai ler essas posições automaticamente!

---

**Resumo:** A página de configuração está pronta e funcional, mas o salvamento ainda precisa ser implementado. Use o workaround SQL ou crie as actions de salvamento. 🚀

