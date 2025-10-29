# 🧙‍♂️ Wizard de Criação de Escalas - Fluxo Completo

## 📋 Visão Geral

O wizard guia o usuário em 3 passos simples para criar uma escala completa, ajustando-se automaticamente ao tipo de escala escolhido.

## 🎯 Fluxo do Wizard

```bash
┌─────────────────────────────────────────────────────────┐
│  STEP 1: Configurações                                  │
│  ┌────────────────────────────────────────────────┐     │
│  │ Equipe: [Selecionar ▼]                         │     │
│  │ Tipo de Escala: [4x2 ▼]                        │     │
│  │ ℹ️ Escala de Ciclo: Requer 3 eletricistas      │     │
│  │ Período: [01/01/2025] até [31/01/2025]         │     │
│  │ Observações: [...]                              │     │
│  │                                                  │     │
│  │                    [Cancelar] [Próximo →]       │     │
│  └────────────────────────────────────────────────┘     │
│         ↓ Salva o período no banco                      │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│  STEP 2: Atribuir Eletricistas                          │
│  ┌────────────────────────────────────────────────┐     │
│  │ ℹ️ Selecione 3 eletricistas para compor        │     │
│  │    Cada um trabalhará 4 dias e folgará 2       │     │
│  │                                                  │     │
│  │ Eletricistas: [João, Maria, Pedro ▼]           │     │
│  │                                                  │     │
│  │ 📅 Data da próxima folga de cada um:           │     │
│  │ ┌──────────────────────────────────────┐       │     │
│  │ │ João Silva        [05/01/2025 📅]    │       │     │
│  │ └──────────────────────────────────────┘       │     │
│  │ ┌──────────────────────────────────────┐       │     │
│  │ │ Maria Santos      [03/01/2025 📅]    │       │     │
│  │ └──────────────────────────────────────┘       │     │
│  │ ┌──────────────────────────────────────┐       │     │
│  │ │ Pedro Costa       [07/01/2025 📅]    │       │     │
│  │ └──────────────────────────────────────┘       │     │
│  │                                                  │     │
│  │              [← Voltar] [Próximo →]             │     │
│  └────────────────────────────────────────────────┘     │
│         ↓ Cria atribuições com ciclos defasados         │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│  STEP 3: Gerar Slots                                    │
│  ┌────────────────────────────────────────────────┐     │
│  │ ✅ Tudo pronto para gerar a escala!            │     │
│  │                                                  │     │
│  │ Resumo:                                         │     │
│  │ ✅ Período criado                              │     │
│  │ ✅ 3 eletricistas atribuídos                   │     │
│  │ ⏳ Slots aguardando geração                    │     │
│  │                                                  │     │
│  │        [← Voltar] [Gerar Slots e Finalizar]    │     │
│  └────────────────────────────────────────────────┘     │
│         ↓ Gera 31 slots (um por dia do mês)             │
└─────────────────────────────────────────────────────────┘

✅ Escala completa criada e pronta para publicação!
```

## 🎨 Diferenças por Tipo de Escala

### Escala 4x2 (CICLO_DIAS)

**Step 2 mostra:**

```bash
┌────────────────────────────────────────┐
│ ℹ️ Selecione 3 eletricistas            │
│ Cada um trabalha 4 dias e folga 2,     │
│ com ciclos defasados (sempre 2/turno)  │
│                                         │
│ Eletricistas: [Máx: 3 ▼]              │
│                                         │
│ 📅 Próxima folga:                      │
│ [Campos de data aparecem aqui]         │
└────────────────────────────────────────┘
```

### Escala Espanhola (SEMANA_DEPENDENTE)

**Step 2 mostra:**

```bash
┌────────────────────────────────────────┐
│ ℹ️ Selecione 2 eletricistas            │
│ Eles trabalharão sempre juntos         │
│ nos mesmos dias                         │
│                                         │
│ Eletricistas: [Máx: 2 ▼]              │
│                                         │
│ (Sem campos de data - não necessário)  │
└────────────────────────────────────────┘
```

## ✨ Vantagens do Wizard

1. **Guiado**: Usuário não precisa pensar na ordem
2. **Inteligente**: Ajusta campos baseado no tipo de escala
3. **Validação em tempo real**: Erros detectados antes de prosseguir
4. **Visual**: Progress indicator mostra onde está
5. **Flexível**: Pode voltar e ajustar passos anteriores
6. **Atômico**: Cada step salva/executa uma ação específica

## 🔄 Ordem de Execução (Backend)

```bash
1. createEscalaEquipePeriodo() → Retorna ID do período
   ↓
2. atribuirEletricistas() → Usa o ID do período
   ↓
3. gerarSlotsEscala() → Usa o ID do período
   ↓
✅ Escala completa!
```

## 🎯 Resultado Final

Após completar o wizard, você terá:

- ✅ **1 EscalaEquipePeriodo** criado
- ✅ **N AtribuiçõesEletricista** criadas (baseado no tipo)
- ✅ **31 SlotEscala** criados (um por dia do mês)
- ✅ **Escala pronta** para publicação

---

**Criado em:** 2025-01-08
**Versão:** 1.0
