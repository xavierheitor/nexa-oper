# Implementação do Novo Modelo de Escala

## Resumo das Alterações

Este documento descreve todas as alterações implementadas para aderir ao novo modelo de escala, onde
os slots são gerados diretamente por eletricista sem necessidade de atribuições separadas.

## Arquivos Criados

### 1. Helpers Utilitários

**Arquivo:** `apps/web/src/lib/services/escala/escalaHelpers.ts`

Funções auxiliares implementadas:

- `resolveStatusDoDia()`: Determina se um dia é TRABALHO ou FOLGA baseado no padrão do TipoEscala
  - Suporta `CICLO_DIAS` (baseado em posições de ciclo)
  - Suporta `SEMANA_DEPENDENTE` (baseado em máscaras semanais)
- `horarioVigente()`: Busca horários previstos de uma equipe para uma data
- `membrosVigentes()`: Retorna eletricistas ativos de uma equipe no período
- Funções auxiliares de data: `normalizarData()`, `calcularDiasDiferenca()`

### 2. DTOs (Data Transfer Objects)

**Arquivo:** `apps/web/src/lib/types/escalaDtos.ts`

Tipos criados para transferência de dados:

- `SlotDTO`: Slot simplificado para listagens
- `DiaResumoDTO`: Resumo diário com contadores (trabalho, folga, falta, excecao)
- `PublicacaoResultDTO`: Resultado da publicação
- `EventoCoberturaDTO`: Evento de cobertura resumido
- `SlotComCoberturaDTO`: Slot com suas coberturas
- `CalendarioEscalaDTO`: Calendário completo da escala
- `ValidacaoComposicaoDTO`: Resultado de validações

## Arquivos Modificados

### 1. Service Principal

**Arquivo:** `apps/web/src/lib/services/escala/EscalaEquipePeriodoService.ts`

#### Método `gerarSlots()` - REFATORADO

**Antes:** Gerava um slot por dia, depois criava atribuições separadas

**Depois:** Gera um slot por (periodoId, data, eletricistaId)

- Busca todos os eletricistas da equipe via `membrosVigentes()`
- Para cada dia:
  - Determina se é TRABALHO ou FOLGA no padrão (via `resolveStatusDoDia()`)
  - Busca horários vigentes (via `horarioVigente()`)
  - Seleciona quais eletricistas compõem o dia (`eletricistasPorTurma`)
  - Cria um slot para CADA eletricista:
    - Estado = TRABALHO se compõe, senão FOLGA
    - Preenche `inicioPrevisto` e `fimPrevisto` se TRABALHO
- Usa `upsert` pela chave única `[escalaEquipePeriodoId, data, eletricistaId]`
- **Nunca cria slots com estado FALTA** (apenas pós-publicação)

#### Método `publicar()` - REFATORADO

**Validações implementadas:**

1. Verifica que não há slots com estado = FALTA
2. Valida composição diária via `validarComposicaoMinimaDiaria()`
3. Incrementa versão ao publicar

#### Novo: `validarComposicaoMinimaDiaria()`

- Para cada dia do período, valida que:
  - `count(estado = TRABALHO) = eletricistasPorTurma`
- Retorna lista de dias com problemas se houver

#### Novo: `marcarFalta()`

**Pré-condição:** período em PUBLICADA

**Ação:**

1. Encontra slot pela chave composta
2. Atualiza `estado = FALTA`
3. Cria `EventoCobertura`:
   - `tipo = FALTA`
   - `resultado = COBERTO` (se cobridorId fornecido) ou `VAGA_DESCOBERTA`
   - Registra justificativa e actorId

#### Novo: `registrarTroca()`

**Pré-condição:** período em PUBLICADA

**Ação:**

1. Encontra slot do titular
2. Verifica que executor pertence à equipe
3. **NÃO altera o estado do slot** (mantém histórico real)
4. Cria `EventoCobertura`:
   - `tipo = TROCA`
   - `resultado = COBERTO`
   - `eletricistaCobrindoId = executorId`

#### Removido

- `atribuirEletricistas()` e métodos auxiliares
- `atribuirCicloComProximaFolga()`
- `atribuirEspanhola()`

### 2. Schemas Zod

**Arquivo:** `apps/web/src/lib/schemas/escalaSchemas.ts`

**Adicionados:**

- `marcarFaltaSchema`: Valida dados para marcar falta

  ```typescript
  {
    periodoId: number
    dataISO: string (YYYY-MM-DD)
    eletricistaId: number
    cobridorId?: number
    justificativa?: string
  }
  ```

- `registrarTrocaSchema`: Valida dados para registrar troca

  ```typescript
  {
    periodoId: number
    dataISO: string (YYYY-MM-DD)
    titularId: number
    executorId: number
    justificativa?: string
  }
  ```

**Tipos exportados:**

- `MarcarFaltaInput`
- `RegistrarTrocaInput`

### 3. Server Actions

**Arquivo:** `apps/web/src/lib/actions/escala/escalaEquipePeriodo.ts`

**Adicionadas:**

- `marcarFaltaAction()`: Action para marcar falta
- `registrarTrocaAction()`: Action para registrar troca

**Removidas:**

- `atribuirEletricistas()`

Ambas as novas actions seguem o padrão do projeto:

- Usam `handleServerAction()`
- Aplicam validação com Zod
- Integram `withLogging`
- Adicionam `actorId` automaticamente da sessão

### 4. UI - Wizard

**Arquivo:** `apps/web/src/app/dashboard/cadastro/escala-equipe-periodo/wizard.tsx`

**Mudanças:**

- Reduzido de 3 para 2 passos:
  1. **Configurações**: Equipe, tipo de escala, período
  2. **Gerar Escala**: Gera slots e finaliza

**Removido:**

- Passo de "Atribuir Eletricistas"
- Seleção de eletricistas
- Datas de próxima folga
- Hooks de eletricistas
- Funções auxiliares relacionadas

**Simplificação:**

- Slots são gerados automaticamente para todos os eletricistas da equipe
- Não há mais necessidade de configurar atribuições manualmente

### 5. UI - Página Principal

**Arquivo:** `apps/web/src/app/dashboard/cadastro/escala-equipe-periodo/page.tsx`

**Removido:**

- Botão "Atribuir Eletricistas" da coluna de ações
- Modal de atribuição
- Estados relacionados: `isAtribuirModalOpen`, `selectedEletricistas`, etc.
- Funções: `handleOpenAtribuir()`, `handleConfirmAtribuir()`
- Import de `atribuirEletricistas` action

**Mantido:**

- Botões: "Gerar Slots", "Publicar", "Arquivar", "Visualizar"
- Fluxo simplificado: Criar → Gerar Slots → Publicar

## Fluxo de Trabalho Atualizado

### 1. Criação de Escala (Wizard ou Form)

```bash
1. Selecionar Equipe
2. Selecionar Tipo de Escala (com eletricistasPorTurma configurado)
3. Definir Período (início e fim)
4. Criar período (status = RASCUNHO)
```

### 2. Geração de Slots

```bash
1. Clicar em "Gerar Slots"
2. Sistema:
   - Busca eletricistas da equipe
   - Para cada dia + eletricista:
     * Determina TRABALHO ou FOLGA
     * Seleciona quem compõe (eletricistasPorTurma)
     * Cria slot com horários se TRABALHO
   - Upsert idempotente
```

### 3. Publicação

```bash
1. Clicar em "Publicar"
2. Sistema valida:
   - Sem slots em FALTA
   - Composição diária correta
3. Se OK: status = PUBLICADA, versao++
```

### 4. Pós-Publicação

#### Marcar Falta

```bash
1. Período deve estar PUBLICADA
2. Fornecer: data, eletricistaId, [cobridorId], [justificativa]
3. Sistema:
   - Atualiza slot.estado = FALTA
   - Cria EventoCobertura (FALTA, COBERTO/VAGA_DESCOBERTA)
```

#### Registrar Troca

```bash
1. Período deve estar PUBLICADA
2. Fornecer: data, titularId, executorId, [justificativa]
3. Sistema:
   - NÃO altera estado do slot
   - Cria EventoCobertura (TROCA, COBERTO)
```

## Validações Implementadas

### Pré-Geração

- Equipe deve ter eletricistas ativos
- Quantidade de eletricistas >= eletricistasPorTurma
- TipoEscala deve ter configuração válida

### Pré-Publicação

- Nenhum slot com estado = FALTA
- Para cada dia: count(TRABALHO) = eletricistasPorTurma

### Pré-Falta/Troca

- Período deve estar em PUBLICADA
- Slot deve existirå
- Executor (para troca) deve pertencer à equipe

## Características Importantes

### Idempotência

- `gerarSlots()` usa `upsert` - pode ser executado múltiplas vezes
- Chave única: `[escalaEquipePeriodoId, data, eletricistaId]`

### Histórico Real

- `SlotEscala.estado` reflete o que realmente aconteceu
- TRABALHO: eletricista escalado e trabalhou
- FOLGA: eletricista não escalado ou em folga
- FALTA: eletricista escalado mas faltou
- `EventoCobertura` registra coberturas e trocas sem alterar o slot original

### Composição Flexível

- Definida por `TipoEscala.eletricistasPorTurma`
- Exemplo: Escala 4x2 com 3 eletricistas → 2 por turma
- Exemplo: Espanhola com 2 eletricistas → 2 por turma

### Horários Dinâmicos

- Slots TRABALHO recebem horários de `EquipeHorarioVigencia`
- Busca vigência ativa para a data do slot
- Calcula `fimPrevisto` baseado em `duracaoHoras`

## Próximos Passos (Opcional)

Para completar a implementação, considere:

1. **UI para Marcar Falta/Troca**
   - Modal para marcar falta com seleção de cobridor
   - Modal para registrar troca entre eletricistas
   - Exibir eventos de cobertura na visualização

2. **Lógica de Rodízio Inteligente**
   - Implementar seleção automática de quem compõe cada dia
   - Considerar histórico de trabalho/folgas
   - Balancear carga entre eletricistas

3. **Visualização de Escalas**
   - Calendário mostrando slots por eletricista
   - Badges coloridos por estado (TRABALHO/FOLGA/FALTA)
   - Indicadores de coberturas/trocas

4. **Relatórios**
   - Relatório de faltas por período
   - Relatório de coberturas
   - Estatísticas de composição

## Compatibilidade

- ✅ Não altera schema Prisma
- ✅ Não gera migrations
- ✅ Mantém padrões do projeto (Zod, handleServerAction, withLogging)
- ✅ TypeScript com tipagem forte
- ✅ Clean code e comentários em português

## Testes Recomendados

1. **Gerar Slots**
   - [ ] Gera um slot por dia por eletricista
   - [ ] TRABALHO para escalados, FOLGA para demais
   - [ ] Horários preenchidos apenas em TRABALHO
   - [ ] Idempotência (rodar 2x = mesmo resultado)

2. **Publicar**
   - [ ] Falha se houver FALTA
   - [ ] Falha se composição incorreta
   - [ ] Sucesso: incrementa versão

3. **Marcar Falta**
   - [ ] Falha se não publicado
   - [ ] Sucesso: slot → FALTA + evento criado
   - [ ] Com cobridor: resultado = COBERTO
   - [ ] Sem cobridor: resultado = VAGA_DESCOBERTA

4. **Registrar Troca**
   - [ ] Falha se não publicado
   - [ ] Sucesso: evento criado, slot inalterado
   - [ ] Executor deve estar na equipe

---

**Data de Implementação:** 08/10/2025 **Versão:** 1.0 **Status:** ✅ Implementado
