# Documentação Técnica: Módulo de Reconciliação Interna

O módulo de **Reconciliação Interna** (`internal-reconciliacao`) é responsável por processar e
validar a relação entre o **Planejado** (Escala) e o **Realizado** (Turnos/Pontos). Seu objetivo é
gerar automaticamente registros de Faltas, Divergências, Presenças e Horas Extras.

## 🏛️ 1. Arquitetura e Estrutura

O módulo segue uma arquitetura modular focada em **Day-Centric Processing** (processamento centrado
no dia) para otimizar performance e clareza de código. Ele divide responsabilidades para evitar
acoplamento excessivo.

### Componentes Principais

1.  **`internal-reconciliacao.service.ts` (O Maestro):**
    - Gerencia o ciclo de vida da execução (Lock, Stats, Loop de dias).
    - Implementa **Batch Fetching** buscar dados em lote e evitar o problema de N+1 queries.
    - Coordena a chamada para os processadores lógicos.
    - Métodos chave: `runReconciliacao`, `reconciliarDia`.

2.  **`reconciliacao-processor.ts` (O Cérebro):**
    - Contém a lógica de negócio **pura**.
    - Avalia cenários para determinar o resultado (Falta, Presença, Divergência ou Hora Extra).
    - Atua principalmente em memória, recebendo dados já carregados.
    - Métodos chave: `processarInteracaoSlot`, `processarExtrafora`.

3.  **`reconciliacao-db.ts` (O Escriba):**
    - Camada de acesso a dados (DAO simplificado).
    - Responsável por persistir (Write) os resultados e realizar buscas otimizadas (Read).
    - Utiliza `upsert` para garantir **idempotência** (pode ser executado múltiplas vezes sem
      duplicar registros).

4.  **`reconciliacao.utils.ts` (Ferramentas):**
    - Funções auxiliares puras, responsáveis por agrupamento de dados (`Map`) e cálculos de horas.

---

## ⚙️ 2. Fluxo de Execução (Workflow)

Ao acionar `runReconciliacao`, o sistema segue o seguinte workflow:

1.  **Job Locking 🔒:**
    - Cria um lock distribuído no banco para garantir unicidade da execução para o job
      `reconciliacao_turnos`.
2.  **Loop por Dia 📅:**
    - Itera sequencialmente sobre o intervalo de dias solicitado, processando um dia inteiro por vez
      para controle de memória.
3.  **Busca em Lote (Batch Fetching) 📥:**
    - Para o dia `D`, busca **todos** os dados necessários em paralelo:
      - Slots de Escala planejados.
      - Aberturas de Turno realizadas (Check-ins).
      - Set Global de eletricistas com escala (para validação de Extra Fora).
4.  **Processamento em Memória 🧠:**
    - Cruza dados de _Planejado_ vs _Realizado_ utilizando Maps para acesso O(1).
5.  **Persistência 💾:**
    - Salva os resultados (Faltas, Divergências, HEs) no banco de dados.
6.  **Release Lock 🔓:**
    - Libera o lock ao finalizar (sucesso ou erro).

---

## 🧠 3. Lógica de Negócio Detalhada

A lógica é dividida em dois eixos principais: **Slots Previstos** e **Turnos Sem Previsão**.

### A. Processamento de Slots (`processarInteracaoSlot`)

Analisa cada slot de escala existente para um eletricista.

| Estado Slot  | Ação Real (Ponto)              | Resultado          | Descrição                                                                                              |
| :----------- | :----------------------------- | :----------------- | :----------------------------------------------------------------------------------------------------- |
| **TRABALHO** | Trabalhou na Equipe Correta    | ✅ **OK**          | Presença confirmada. Nenhuma ação necessária.                                                          |
| **TRABALHO** | Trabalhou em Equipe Divergente | ⚠️ **DIVERGÊNCIA** | Cria `DivergenciaEscala`. Ex: Escalado na Eq A, trabalhou na Eq B.                                     |
| **TRABALHO** | Sem registro de ponto          | ❌ **FALTA**       | Cria `Falta`. Verifica antes se o status do funcionário justifica (ex: FÉRIAS usa lógica de exclusão). |
| **FOLGA**    | Houve registro de ponto        | 💰 **HORA EXTRA**  | Tipo: `folga_trabalhada`. Calcula horas realizadas vs 0 previstas.                                     |

### B. Processamento de Extras Fora (`processarExtrafora`)

Analisa eletricistas que trabalharam mas **não possuíam nenhum slot de escala** (nem trabalho, nem
folga) no dia.

- O sistema verifica globalmente: "Este eletricista existe em alguma escala hoje?".
  - Se **SIM** (mesmo que em outra equipe): Já foi tratado no fluxo A (como Folga Trabalhada ou
    Divergência).
  - Se **NÃO** (não existe na escala): É classificado como **EXTRA FORA**.
  - **Ação:** Cria registro de `HoraExtra` do tipo `extrafora`.

---

## 🔍 4. Estratégia de Dados (Data fetching)

A eficiência do módulo reside na estratégia de busca em `reconciliacao-db.ts`:

1.  **`buscarSlotsEscala`**:
    - Carrega Slots + Relacionamentos (Eletricista, Equipe).
    - Filtra apenas escalas com status `PUBLICADA`.

2.  **`buscarAberturasDia`**:
    - Busca na tabela `TurnoRealizadoEletricista`.
    - Determina efetivamente quem compareceu.

3.  **`buscarTodosSlotsDia` (Global Check)**:
    - Query leve (SELECT `eletricistaId`) para criar um `Set` de verificação rápida.
    - Crucial para distinguir corretamente entre _Folga Trabalhada_ e _Extra Fora_.

---

## 🛡️ 5. Robustez e Segurança

- **Idempotência**: O uso extensivo de `upsert` previne duplicação de dados. Re-executar a
  reconciliação corrige o estado sem criar "sujeira".
- **Justificativas Automáticas**: Ao detectar falta, o sistema verifica o `Status` do eletricista
  (ex: `FERIAS`, `LICENCA_MEDICA`). Se for um status justificável, a falta não é gerada.
- **Concorrência**: O mecanismo de Locking impede execução simultânea que poderia causar Race
  Conditions.
