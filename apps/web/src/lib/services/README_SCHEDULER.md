# Serviço de Tarefas Agendadas (Scheduler)

## Visão Geral

Este serviço gerencia jobs agendados usando `node-cron` no Next.js. É inicializado automaticamente quando a aplicação inicia no servidor.

## Funcionalidades

### Jobs Agendados

1. **Snapshot Parcial (12h)**
   - Executa diariamente às 12:00
   - Gera snapshot de aderência considerando apenas turnos até meio-dia
   - Timezone: `America/Sao_Paulo`

2. **Snapshot Final (23:59)**
   - Executa diariamente às 23:59
   - Gera snapshot completo do dia
   - Timezone: `America/Sao_Paulo`

## Como Funciona

### Inicialização

O scheduler é inicializado automaticamente no `instrumentation.ts`:

```typescript
export async function register() {
  if (typeof window === 'undefined') {
    const { schedulerService } = await import('./src/lib/services/scheduler.service');
    schedulerService.initialize();
  }
}
```

### Graceful Shutdown

O scheduler é parado automaticamente durante o graceful shutdown:

```typescript
// Em shutdown.ts
const { schedulerService } = await import('../services/scheduler.service');
schedulerService.stop();
```

## Integração com API

### Atualização de Snapshot Após Abertura de Turno

Quando um turno é aberto via API após o snapshot parcial (12h), você pode chamar a Server Action:

```typescript
// Na API, após abrir turno:
import { atualizarSnapshotAposAbertura } from '@nexa-oper/web/lib/actions/turno/atualizarSnapshotAposAbertura';

await atualizarSnapshotAposAbertura({
  equipeId: turno.equipeId,
  dataReferencia: turno.dataInicio,
  turnoId: turno.id,
  dataAbertura: turno.dataInicio,
});
```

**Alternativa**: Criar um webhook endpoint no web que a API chama:

```typescript
// apps/web/src/app/api/webhooks/turno-aberto/route.ts
import { atualizarSnapshotAposAbertura } from '@/lib/actions/turno/atualizarSnapshotAposAbertura';

export async function POST(req: Request) {
  const data = await req.json();
  const result = await atualizarSnapshotAposAbertura(data);
  return Response.json(result);
}
```

## Configuração

### Variáveis de Ambiente

Nenhuma variável de ambiente específica é necessária. O scheduler usa as mesmas configurações do Next.js.

### Timezone

Os jobs são configurados para `America/Sao_Paulo`. Para alterar, edite `scheduler.service.ts`:

```typescript
timezone: 'America/Sao_Paulo', // Altere aqui
```

## Monitoramento

Os logs do scheduler aparecem no console do servidor:

```bash
[Scheduler] Inicializando jobs agendados...
[Scheduler] 2 jobs agendados e ativos
[Scheduler] Executando snapshot parcial (meio-dia)...
[Scheduler] Snapshot parcial concluído - Total: 15
```

## Troubleshooting

### Jobs não estão executando

1. Verifique se está rodando no servidor (não no cliente)
2. Verifique os logs do servidor
3. Verifique se `instrumentation.ts` está sendo executado
4. Verifique se `node-cron` está instalado

### Erro ao executar job

Os erros são logados no console mas não interrompem a execução. Verifique os logs para detalhes.

## Desenvolvimento

### Testar jobs manualmente

Você pode chamar as Server Actions diretamente:

```typescript
import { gerarSnapshotAderencia } from '@/lib/actions/turno/gerarSnapshotAderencia';

// Snapshot parcial
await gerarSnapshotAderencia({
  geradoPor: 'teste',
  horarioLimite: '12:00:00',
});

// Snapshot completo
await gerarSnapshotAderencia({
  geradoPor: 'teste',
});
```
