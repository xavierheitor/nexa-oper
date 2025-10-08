# 📋 Exemplos de Configuração de Tipos de Escala

## 🎯 Como Configurar um Tipo de Escala

Ao criar um **Tipo de Escala**, você define:
1. **Nome** - Ex: "4x2 Padrão", "Espanhola", "4x1"
2. **Modo de Repetição** - CICLO_DIAS ou SEMANA_DEPENDENTE
3. **Ciclo/Periodicidade** - Quantos dias/semanas
4. **Quantidade de Eletricistas** - Quantos compõem essa escala
5. **Padrão de Trabalho/Folga** - Quais dias/posições são trabalho

---

## 📌 Exemplos Práticos

### 1. Escala 4x2 Padrão (3 eletricistas)

```yaml
Nome: "4x2 Padrão"
Modo: CICLO_DIAS
Ciclo: 6 dias
Eletricistas Necessários: 3
Padrão do Ciclo:
  - Posição 0-1: FOLGA
  - Posição 2-5: TRABALHO
```

**Resultado:**
- 3 eletricistas em ciclos defasados
- Sempre 2 trabalhando simultaneamente
- Cada um: 4 dias trabalho + 2 dias folga

---

### 2. Escala Espanhola Básica (2 eletricistas)

```yaml
Nome: "Espanhola 2 Pessoas"
Modo: SEMANA_DEPENDENTE
Periodicidade: 2 semanas
Eletricistas Necessários: 2
Padrão das Semanas:
  Semana A (Semana 0):
    - Segunda a Domingo: TRABALHO
  Semana B (Semana 1):
    - Segunda a Sexta: TRABALHO
    - Sábado e Domingo: FOLGA
```

**Resultado:**
- 2 eletricistas trabalhando sempre juntos
- Semana A: trabalham todos os dias
- Semana B: folga no final de semana (turno não abre)

---

### 3. Escala Espanhola Premium (4 eletricistas)

```yaml
Nome: "Espanhola 4 Pessoas"
Modo: SEMANA_DEPENDENTE
Periodicidade: 2 semanas
Eletricistas Necessários: 4
Padrão das Semanas:
  Semana A: Segunda a Domingo TRABALHO
  Semana B: Segunda a Sexta TRABALHO, Sábado e Domingo FOLGA
```

**Resultado:**
- 4 eletricistas trabalhando sempre juntos
- Maior cobertura/segurança
- Mesma lógica da Espanhola, mas com mais pessoas

---

### 4. Escala 4x1 (5 eletricistas)

```yaml
Nome: "4x1"
Modo: CICLO_DIAS
Ciclo: 5 dias
Eletricistas Necessários: 5
Padrão do Ciclo:
  - Posição 0: FOLGA
  - Posição 1-4: TRABALHO
```

**Resultado:**
- 5 eletricistas em ciclos defasados
- Sempre 4 trabalhando simultaneamente
- Cada um: 4 dias trabalho + 1 dia folga

---

### 5. Escala 5x2 (4 eletricistas)

```yaml
Nome: "5x2"
Modo: CICLO_DIAS
Ciclo: 7 dias
Eletricistas Necessários: 4
Padrão do Ciclo:
  - Posição 0-1: FOLGA
  - Posição 2-6: TRABALHO
```

**Resultado:**
- 4 eletricistas em ciclos defasados
- Aproximadamente 3 trabalhando por dia
- Cada um: 5 dias trabalho + 2 dias folga

---

## 🧮 Como Calcular a Quantidade de Eletricistas

### Para Escalas com Ciclo (CICLO_DIAS):

**Fórmula:**
```
Quantidade = (Ciclo × Pessoas por Turno) ÷ Dias de Trabalho
```

**Exemplos:**

**4x2 → 2 por turno:**
```
(6 dias × 2 por turno) ÷ 4 dias de trabalho = 3 eletricistas
```

**4x1 → 4 por turno:**
```
(5 dias × 4 por turno) ÷ 4 dias de trabalho = 5 eletricistas
```

**5x2 → 3 por turno:**
```
(7 dias × 3 por turno) ÷ 5 dias de trabalho = 4.2 → 4 eletricistas
```

### Para Escalas Semanais (SEMANA_DEPENDENTE):

Simples: **Quantidade = Quantos você quer no turno**

- 2 eletricistas? Configure 2
- 4 eletricistas? Configure 4
- Todos trabalham sempre juntos

---

## 💡 Dicas de Configuração

### ✅ Boas Práticas:

1. **Nome Descritivo**: "4x2 Padrão", não apenas "4x2"
2. **Testar Matemática**: Usar a fórmula para validar
3. **Documentar no Campo Observações**: Ex: "Escala para equipe Alpha, cobertura 24/7"
4. **Começar com Tipos Comuns**: 4x2, Espanhola, depois criar customizados

### ⚠️ Cuidados:

1. **Validar Cobertura**: Quantidade × Dias Trabalho = Ciclo × Pessoas/Turno
2. **Considerar Imprevistos**: Férias, licenças, etc
3. **Testar Antes de Publicar**: Criar período rascunho e verificar

---

## 🚀 Fluxo de Criação Completo

```
1. Cadastrar Tipo de Escala
   ├── Ex: "4x1 Noturno"
   ├── Ciclo: 5 dias
   ├── Eletricistas: 5
   └── Configurar posições: 0=F, 1-4=T

2. Criar Período usando este Tipo
   ├── Sistema já sabe que precisa de 5 eletricistas
   ├── No wizard, pede exatamente 5
   └── Calcula ciclos automaticamente

3. Gerar Slots
   └── Sistema cria os dias com base no ciclo configurado

✅ Escala completa e personalizada!
```

---

**Criado em:** 2025-01-08
**Versão:** 1.0 - Sistema Flexível

