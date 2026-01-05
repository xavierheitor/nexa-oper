# Análise: Pendências do Checklist e Reprovações

## 📋 Resumo Executivo

Foi identificada uma **inconsistência crítica** no processamento de fotos de reprovação
(`checklistReprova`): quando uma foto de reprovação é enviada com UUID do checklist, o sistema **não
cria** a pendência na tabela `ChecklistPendencias` se ela não existir previamente. Isso faz com que
reprovações não sejam registradas corretamente.

---

## 🔍 Fluxo Atual de Criação de Pendências

### 1. Criação Automática de Pendências

**Localização**: `apps/api/src/modules/turno/services/checklist-preenchido.service.ts`

**Método**: `processarPendenciasAutomaticas()`

**Quando acontece**: Após salvar um checklist preenchido, durante o processamento assíncrono.

**Como funciona**:

- Itera sobre todas as respostas do checklist
- Verifica se a opção de resposta tem `geraPendencia = true`
- Se sim, cria uma pendência automaticamente na tabela `ChecklistPendencias`

```350:410:apps/api/src/modules/turno/services/checklist-preenchido.service.ts
  async processarPendenciasAutomaticas(
    checklistPreenchidoId: number,
    respostas: any[]
  ): Promise<any[]> {
    const prisma = this.db.getPrisma();
    const pendencias: any[] = [];

    // ✅ Validar que array de respostas não está vazio
    if (!respostas || respostas.length === 0) {
      return pendencias; // Retorna vazio se não houver respostas
    }

    // Buscar informações do checklist preenchido
    const checklistPreenchido = await prisma.checklistPreenchido.findUnique({
      where: { id: checklistPreenchidoId },
      include: {
        turno: true,
      },
    });

    if (!checklistPreenchido) {
      throw new NotFoundException('Checklist preenchido não encontrado');
    }

    // Para cada resposta, verificar se gera pendência
    for (const respostaData of respostas) {
      const opcaoResposta = await prisma.checklistOpcaoResposta.findUnique({
        where: { id: respostaData.opcaoRespostaId },
      });

      if (opcaoResposta?.geraPendencia) {
        // Buscar a resposta salva
        const resposta = await prisma.checklistResposta.findFirst({
          where: {
            checklistPreenchidoId,
            perguntaId: respostaData.perguntaId,
            opcaoRespostaId: respostaData.opcaoRespostaId,
          },
        });

        if (resposta) {
          // Criar pendência
          const pendencia = await prisma.checklistPendencia.create({
            data: {
              checklistRespostaId: resposta.id,
              checklistPreenchidoId,
              turnoId: checklistPreenchido.turnoId,
              status: 'AGUARDANDO_TRATAMENTO',
              observacaoProblema: `Pendência gerada automaticamente pela resposta: ${opcaoResposta.nome}`,
              createdAt: new Date(),
              createdBy: 'system',
            },
          });

          pendencias.push(pendencia);
        }
      }
    }

    return pendencias;
  }
```

**Limitação**: Só cria pendências para opções de resposta que têm `geraPendencia = true`.

---

### 2. Processamento de Fotos de Pendência/Reprovação

**Localização**: `apps/api/src/modules/mobile-upload/services/mobile-photo-upload.service.ts`

**Método**: `handleUpload()`

**Quando acontece**: Quando o app mobile envia uma foto do tipo `pendencia` ou `checklistReprova`.

**Condição para processar**:

```132:143:apps/api/src/modules/mobile-upload/services/mobile-photo-upload.service.ts
    // Processar foto de pendência se aplicável
    const shouldProcessPendencia =
      (payload.tipo === 'pendencia' || payload.tipo === 'checklistReprova') &&
      payload.checklistPerguntaId;

    this.logger.debug(
      `[UPLOAD] Deve processar pendência? ${shouldProcessPendencia}`
    );
    this.logger.debug(
      `[UPLOAD] Condições: tipo=${payload.tipo}, checklistUuid=${payload.checklistUuid}, checklistPerguntaId=${payload.checklistPerguntaId}`
    );

    if (shouldProcessPendencia) {
```

**Fluxo**:

- Se tem `checklistUuid`: chama `processarFotoPendenciaComUuid()`
- Se não tem `checklistUuid`: chama `processarFotoPendenciaSemUuid()`

---

### 3. Processamento COM UUID (PROBLEMA IDENTIFICADO)

**Método**: `processarFotoPendenciaComUuid()`

**Problema Crítico**: O método **busca** a pendência existente, mas **não cria** se não encontrar!

```469:476:apps/api/src/modules/mobile-upload/services/mobile-photo-upload.service.ts
      // Buscar a pendência relacionada à resposta
      const pendencia = resposta.ChecklistPendencia;
      if (!pendencia) {
        this.logger.warn(
          `[PENDENCIA-UUID] Pendência não encontrada para resposta: checklistRespostaId=${resposta.id}`
        );
        return;
      }
```

**Impacto**:

- Se uma foto de reprovação (`checklistReprova`) é enviada e a pendência ainda não existe
- O sistema apenas registra um warning nos logs
- **A pendência NÃO é criada na tabela**
- **A foto NÃO é vinculada**
- **A reprovação fica perdida no sistema**

**Cenário onde isso acontece**:

1. Checklist é preenchido com uma resposta que **não tem** `geraPendencia = true`
2. Eletricista identifica problema e tira foto de reprovação
3. App envia foto do tipo `checklistReprova` com UUID
4. Sistema busca pendência → não encontra → retorna sem criar
5. ❌ Pendência não é criada, foto não é vinculada

---

### 4. Processamento SEM UUID (FUNCIONA CORRETAMENTE)

**Método**: `processarFotoPendenciaSemUuid()`

**Comportamento**: Este método **cria** a pendência se não encontrar!

```323:337:apps/api/src/modules/mobile-upload/services/mobile-photo-upload.service.ts
        // Buscar ou criar pendência
        let pendencia = resposta.ChecklistPendencia;
        if (!pendencia) {
          this.logger.debug(`[PENDENCIA-SEM-UUID] Criando nova pendência para resposta ${resposta.id}`);
          pendencia = await this.db.getPrisma().checklistPendencia.create({
            data: {
              checklistRespostaId: resposta.id,
              checklistPreenchidoId: resposta.checklistPreenchidoId,
              turnoId: turnoId,
              status: 'AGUARDANDO_TRATAMENTO',
              createdAt: new Date(),
              createdBy: 'system',
            },
          });
        }
```

**Por que funciona**:

- Se não encontrar pendência, cria uma nova
- Vincula a foto corretamente
- Registra a reprovação na tabela

**Limitação**: Este método busca por `perguntaId` no turno, pode encontrar múltiplas respostas (se
houver vários checklists no mesmo turno).

---

## 🐛 Análise do Problema

### Comparação dos Métodos

| Aspecto                                 | Com UUID                    | Sem UUID                     |
| --------------------------------------- | --------------------------- | ---------------------------- |
| **Cria pendência se não existir?**      | ❌ **NÃO**                  | ✅ **SIM**                   |
| **Precisão na busca**                   | ✅ Alta (UUID + perguntaId) | ⚠️ Média (apenas perguntaId) |
| **Comportamento para checklistReprova** | ❌ Falha silenciosa         | ✅ Funciona                  |
| **Logs de erro**                        | ⚠️ Apenas warning           | ✅ Debug adequado            |

### Cenários Afetados

#### ✅ Cenário 1: Pendência já existe (funciona)

1. Checklist preenchido → opção com `geraPendencia = true` → pendência criada automaticamente
2. Foto de reprovação enviada com UUID
3. Sistema encontra pendência existente
4. Foto é vinculada corretamente
5. ✅ **Funciona**

#### ❌ Cenário 2: Pendência NÃO existe (FALHA)

1. Checklist preenchido → opção **sem** `geraPendencia = true` → pendência **não** criada
2. Eletricista identifica problema e tira foto de reprovação
3. Foto de reprovação enviada com UUID (`checklistReprova`)
4. Sistema busca pendência → não encontra
5. Sistema retorna sem criar pendência (apenas warning)
6. ❌ **Falha**: Pendência não criada, foto não vinculada, reprovação perdida

#### ⚠️ Cenário 3: Sem UUID (funciona, mas com limitação)

1. Foto de reprovação enviada **sem** UUID
2. Sistema usa método `processarFotoPendenciaSemUuid()`
3. Sistema busca resposta por `perguntaId` no turno
4. Se não encontrar pendência, **cria uma nova**
5. ✅ **Funciona**, mas pode encontrar múltiplas respostas

---

## 📊 Impacto no Sistema

### Dados Afetados

- **Tabela `ChecklistPendencias`**: Pendências de reprovação não estão sendo criadas
- **Tabela `ChecklistRespostaFoto`**: Fotos não estão sendo vinculadas às pendências
- **Rastreabilidade**: Reprovações enviadas pelo mobile ficam perdidas

### Impacto nos Usuários

- ❌ Reprovações não aparecem na listagem de pendências
- ❌ Não é possível rastrear problemas identificados pelos eletricistas
- ❌ Gestão de qualidade comprometida

---

## ✅ Solução Implementada

### Correção no Método `processarFotoPendenciaComUuid()`

**Localização**: `apps/api/src/modules/mobile-upload/services/mobile-photo-upload.service.ts`

**Status**: ✅ **IMPLEMENTADO**

**Alteração realizada**: Criar pendência se não existir, seguindo o mesmo padrão do método
`processarFotoPendenciaSemUuid()`, com tratamento de race condition.

**Código atual** (linhas 469-476):

```typescript
// Buscar a pendência relacionada à resposta
const pendencia = resposta.ChecklistPendencia;
if (!pendencia) {
  this.logger.warn(
    `[PENDENCIA-UUID] Pendência não encontrada para resposta: checklistRespostaId=${resposta.id}`
  );
  return; // ❌ Retorna sem criar
}
```

**Código implementado**:

```typescript
// Buscar ou criar pendência relacionada à resposta
let pendencia = resposta.ChecklistPendencia;
if (!pendencia) {
  this.logger.debug(
    `[PENDENCIA-UUID] Pendência não encontrada, criando nova para resposta: checklistRespostaId=${resposta.id}`
  );

  try {
    // Criar pendência para reprovação
    pendencia = await this.db.getPrisma().checklistPendencia.create({
      data: {
        checklistRespostaId: resposta.id,
        checklistPreenchidoId: resposta.checklistPreenchidoId,
        turnoId: checklistPreenchido.turnoId,
        status: 'AGUARDANDO_TRATAMENTO',
        observacaoProblema: 'Pendência criada a partir de foto de reprovação',
        createdAt: new Date(),
        createdBy: 'system',
      },
    });

    this.logger.debug(
      `[PENDENCIA-UUID] Pendência criada: ID=${pendencia.id}, checklistRespostaId=${resposta.id}`
    );
  } catch (error: any) {
    // Tratar race condition: se outra requisição criou a pendência simultaneamente
    if (error?.code === 'P2002' && error?.meta?.target?.includes('checklistRespostaId')) {
      this.logger.debug(
        `[PENDENCIA-UUID] Pendência já existe (race condition), buscando novamente: checklistRespostaId=${resposta.id}`
      );

      // Buscar a pendência que foi criada pela outra requisição
      pendencia = await this.db.getPrisma().checklistPendencia.findUnique({
        where: { checklistRespostaId: resposta.id },
      });

      if (!pendencia) {
        this.logger.error(
          `[PENDENCIA-UUID] Erro ao buscar pendência após race condition: checklistRespostaId=${resposta.id}`
        );
        return;
      }

      this.logger.debug(
        `[PENDENCIA-UUID] Pendência encontrada após race condition: ID=${pendencia.id}`
      );
    } else {
      // Re-lançar erro se não for race condition
      this.logger.error(
        `[PENDENCIA-UUID] Erro ao criar pendência: ${error}`,
        error
      );
      throw error;
    }
  }
} else {
  this.logger.debug(`[PENDENCIA-UUID] Pendência encontrada: ID=${pendencia.id}`);
}
```

**Melhorias implementadas**:
- ✅ Criação automática de pendência quando não existe
- ✅ Tratamento de race condition (múltiplas fotos chegando simultaneamente)
- ✅ Logs detalhados para debugging
- ✅ Mesmo tratamento aplicado ao método `processarFotoPendenciaSemUuid()` para consistência

---

## 🧪 Cenários de Teste Recomendados

### Teste 1: Reprovação sem pendência prévia (com UUID)

1. Criar checklist preenchido com resposta que **não gera** pendência automática
2. Enviar foto do tipo `checklistReprova` com UUID
3. ✅ **Esperado**: Pendência deve ser criada na tabela
4. ✅ **Esperado**: Foto deve ser vinculada à pendência

### Teste 2: Reprovação com pendência prévia (com UUID)

1. Criar checklist preenchido com resposta que **gera** pendência automática
2. Enviar foto do tipo `checklistReprova` com UUID
3. ✅ **Esperado**: Pendência existente deve ser encontrada
4. ✅ **Esperado**: Foto deve ser vinculada à pendência existente

### Teste 3: Reprovação sem UUID (fallback)

1. Enviar foto do tipo `checklistReprova` **sem** UUID
2. ✅ **Esperado**: Sistema deve usar método fallback
3. ✅ **Esperado**: Pendência deve ser criada se não existir

---

## 📝 Conclusão

A inconsistência entre os dois métodos de processamento (`com UUID` vs `sem UUID`) foi **corrigida**.
Agora ambos os métodos criam pendências automaticamente quando necessário, garantindo que todas as
reprovações sejam registradas corretamente na tabela `ChecklistPendencias`, mesmo quando a foto
chega depois do checklist ser salvo (fila de upload do app mobile).

**Melhorias implementadas**:
- ✅ Pendências são criadas automaticamente para fotos de reprovação
- ✅ Funciona mesmo quando a foto chega depois (fila de upload)
- ✅ Tratamento de race condition para uploads simultâneos
- ✅ Comportamento consistente entre métodos com e sem UUID

---

**Data da Análise**: 2025-01-27
**Data da Implementação**: 2025-01-27
**Arquivo**: `ANALISE_PENDENCIAS_CHECKLIST.md`
