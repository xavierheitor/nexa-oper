# Análise dos TODOs Não Implementados

## Resumo da Análise

Após análise detalhada, identifiquei os seguintes TODOs e suas recomendações:

---

## 1. ✅ **IMPLEMENTAR** - Contexto do Usuário do JWT

### Localizações:
- `apps/api/src/modules/apr/services/apr.service.ts` (linha 147)
- `apps/api/src/modules/checklist/services/checklist.service.ts` (linha 164)
- `apps/api/src/modules/turno/services/checklist-preenchido.service.ts` (linha 197)
- `apps/api/src/modules/turno/services/checklist-foto.service.ts` (linha 70)

### Análise:
- **Status Atual**: Todos usam `getDefaultUserContext()` que retorna `'system'`
- **Problema**: Dados de auditoria incorretos (sempre 'system' em vez do usuário real)
- **Impacto**: ⚠️ **MÉDIO** - Afeta auditoria e rastreabilidade, mas não quebra funcionalidade

### Solução Proposta:
1. Modificar métodos dos serviços para aceitar `userId` opcional como parâmetro
2. Nos controllers, extrair `userId` usando `@GetUsuarioMobileId` decorator (já existe)
3. Passar `userId` para os serviços quando disponível
4. Manter fallback para `'system'` quando não houver usuário (schedulers, jobs)

### Implementação:
- ✅ **PODE SER FEITO** sem quebrar código existente
- ✅ **NÃO interfere** com tarefas agendadas (schedulers)
- ✅ **Melhora** qualidade de auditoria

---

## 2. ⏸️ **DEFERIR** - Calcular Atrasos e Divergências

### Localização:
- `apps/api/src/modules/turno-realizado/turno-realizado.service.ts` (linhas 346-347)
  ```typescript
  atrasos: 0, // TODO: calcular atrasos
  divergenciasEquipe: 0, // TODO: calcular divergências
  ```

### Análise:
- **Status Atual**: Valores hardcoded como `0`
- **Contexto**: Método `resumo()` retorna dados consolidados de frequência
- **Impacto**: ⚠️ **BAIXO** - Funcionalidade funciona, apenas faltam métricas

### Recomendação:
- ⏸️ **DEFERIR** para implementação futura
- **Motivo**:
  - Requer análise de regras de negócio complexas
  - Pode ser calculado em tarefas agendadas (schedulers)
  - Não afeta funcionalidade atual
  - Pode ser implementado junto com melhorias de relatórios

### Quando Implementar:
- Quando houver definição clara das regras:
  - O que é considerado "atraso"? (ex: aberto após X minutos do horário previsto)
  - O que é "divergência de equipe"? (ex: eletricista de outra equipe)
- Pode ser feito em scheduler separado que calcula essas métricas periodicamente

---

## 3. 📝 **NOTA** - CDN para Fotos

### Localização:
- `apps/api/src/modules/turno/services/checklist-foto.service.ts` (linha 260)
  ```typescript
  // TODO: Implementar CDN ou storage em nuvem
  ```

### Análise:
- **Status Atual**: Fotos salvas localmente
- **Impacto**: ⚠️ **BAIXO** - Funcionalidade funciona, apenas otimização futura

### Recomendação:
- 📝 **NOTA** - Não é TODO crítico, apenas melhoria futura
- Deixar como está, não remover o comentário pois é útil para referência futura

---

## Plano de Implementação

### Fase 1: Implementar Contexto do Usuário (✅ RECOMENDADO)

**Arquivos a Modificar:**

1. **Services** - Adicionar parâmetro `userId` opcional:
   - `checklist-preenchido.service.ts` - método `salvarChecklistsDoTurno()`
   - `checklist-foto.service.ts` - método `sincronizarFoto()`
   - `apr.service.ts` - método `getCurrentUserContext()` (se chamado de controller)
   - `checklist.service.ts` - método `getCurrentUserContext()` (se chamado de controller)

2. **Controllers** - Extrair e passar userId:
   - `turno-mobile.controller.ts` - extrair userId e passar para `abrirTurno()`
   - `checklist-foto.controller.ts` - extrair userId e passar para `sincronizarFoto()`
   - Outros controllers que chamam métodos com auditoria

3. **Services Intermediários** - Repassar userId:
   - `turno.service.ts` - receber userId e repassar para `checklistPreenchidoService`

**Exemplo de Implementação:**

```typescript
// Controller
async abrirTurno(
  @Body() mobileDto: MobileAbrirTurnoDto,
  @GetUsuarioMobileId() userId: string,
  @GetUserContracts() allowedContracts: ContractPermission[]
) {
  // ...
  const turnoResult = await this.turnoService.abrirTurno(
    abrirDto,
    userId, // ✅ Passar userId
    allowedContracts
  );
}

// Service
async abrirTurno(
  abrirDto: AbrirTurnoDto,
  userId?: string, // ✅ Parâmetro opcional
  allowedContracts?: ContractPermission[]
) {
  const userContext = userId
    ? { userId, userName: userId, roles: [] } // ✅ Usar userId real
    : getDefaultUserContext(); // ✅ Fallback para 'system'

  // ...
  await this.checklistPreenchidoService.salvarChecklistsDoTurno(
    turno.id,
    abrirDto.checklists,
    transaction,
    userId // ✅ Passar userId
  );
}
```

### Fase 2: Deferir Atrasos e Divergências (⏸️)

- Manter TODOs como estão
- Documentar que serão implementados futuramente
- Quando implementar, considerar criar scheduler dedicado

### Fase 3: Manter Nota sobre CDN (📝)

- Não remover comentário
- Pode ser útil para planejamento futuro

---

## Conclusão

✅ **IMPLEMENTAR**: Contexto do usuário (4 arquivos)
⏸️ **DEFERIR**: Atrasos e divergências (análise futura necessária)
📝 **MANTER**: Nota sobre CDN (não é TODO crítico)

