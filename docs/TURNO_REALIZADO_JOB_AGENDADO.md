# Job Agendado: Reconciliação Diária de Turnos

## Objetivo
Executar reconciliação automática de turnos realizados vs. escala planejada todos os dias às 23h, processando dias pendentes e aguardando margem de 30 minutos para turnos que não foram abertos.

## Configuração

### Dependência
```bash
npm install @nestjs/schedule
```

### Módulo
Adicionar `ScheduleModule` ao `AppModule`:
```typescript
import { ScheduleModule } from '@nestjs/schedule';

@Module({
  imports: [
    ScheduleModule.forRoot(),
    // ... outros módulos
  ],
})
```

## Implementação

### Serviço: TurnoReconciliacaoSchedulerService

**Arquivo**: `apps/api/src/modules/turno-realizado/turno-reconciliacao-scheduler.service.ts`

**Responsabilidades**:
1. Executar job diário às 23h
2. Reconcilia todos os dias pendentes (últimos 30 dias)
3. Aguarda margem de 30 minutos após horário previsto antes de marcar falta
4. Processa apenas dias que ainda não foram reconciliados (ou reconciliados antes das 23h)
5. Log de execução e erros

**Estrutura**:
```typescript
@Injectable()
export class TurnoReconciliacaoSchedulerService {
  constructor(
    private readonly turnoReconciliacaoService: TurnoReconciliacaoService,
    private readonly db: DatabaseService,
    private readonly logger: Logger,
  ) {}

  @Cron('0 23 * * *') // Diário às 23h
  async executarReconciliacaoDiaria() {
    // Lógica de reconciliação
  }
}
```

## Lógica do Job

### 1. Identificar Dias Pendentes
- Buscar últimos 30 dias
- Para cada dia, verificar se já foi reconciliado após as 23h do dia anterior
- Processar apenas dias pendentes

### 2. Margem de 30 Minutos
Para cada slot de escala:
- Calcular horário limite: `inicioPrevisto + 30 minutos`
- Se hora atual < horário limite: Não criar falta ainda (aguardar)
- Se hora atual >= horário limite: Processar reconciliação

### 3. Processar Reconciliação
Para cada dia pendente:
- Chamar `TurnoReconciliacaoService.reconciliarDiaEquipe()` para cada equipe
- Processar em batch (paralelo ou sequencial, dependendo da carga)

### 4. Registrar Execução
- Criar log de execução (opcional: tabela `JobExecution`)
- Registrar sucessos e falhas
- Permite auditoria e debug

## Exemplo de Fluxo

### Cenário: Job executa às 23h do dia 15/01/2024

1. **Identificar dias pendentes**:
   - 15/01/2024 (hoje)
   - 14/01/2024 (se não foi reconciliado)
   - 13/01/2024 (se não foi reconciliado)
   - ... até 30 dias atrás

2. **Para cada dia**:
   - Buscar todas as equipes com escala ativa
   - Para cada equipe, verificar slots de escala
   - Para cada slot:
     - Se `estado = TRABALHO`:
       - Verificar se eletricista abriu turno
       - Se não abriu E horário limite já passou: Criar falta
       - Se não abriu mas horário limite não passou: Aguardar (não criar falta ainda)
     - Se `estado = FOLGA`:
       - Verificar se eletricista abriu turno (hora extra)
       - Processar normalmente

3. **Processar reconcialiação completa**:
   - Chamar `reconciliarDiaEquipe()` para cada equipe/dia
   - Processar faltas, divergências, horas extras

## Horários de Execução

### Job Principal
- **Horário**: 23:00 (todos os dias)
- **Cron**: `0 23 * * *`

### Considerações
- **Timezone**: Usar timezone do servidor (ou configurável via env)
- **Margem de 30min**: Aplicada por slot (não por dia)
  - Exemplo: Slot 08:00 → limite 08:30
  - Exemplo: Slot 14:00 → limite 14:30

## Exemplo Prático

### Dia 15/01/2024, 23:00

**Slots do dia**:
- Eletricista 1: 08:00-17:00 (TRABALHO)
- Eletricista 2: 08:00-17:00 (TRABALHO)
- Eletricista 3: FOLGA

**Turnos abertos**:
- Eletricista 1: Abriu 08:15 (dentro da margem)
- Eletricista 2: Não abriu

**Processamento**:
1. Eletricista 1: ✅ Abriu (normal, mesmo com 15min de atraso, dentro da margem)
2. Eletricista 2: ❌ Não abriu e já passou 08:30 → Criar falta
3. Eletricista 3: ✅ Folga (sem ação)

## Tratamento de Erros

### Erros Não Críticos
- Se erro ao processar uma equipe: Continuar com outras equipes
- Logar erro mas não interromper job
- Registrar em log estruturado

### Erros Críticos
- Se erro de conexão com banco: Interromper job e alertar
- Se erro de validação crítica: Interromper e alertar

### Retry
- Não implementar retry automático (executa novamente no dia seguinte)
- Se necessário, implementar retry manual via endpoint administrativo

## Logs

### Estrutura de Log
```typescript
{
  timestamp: '2024-01-15T23:00:00Z',
  job: 'reconciliacao-diaria',
  status: 'success' | 'error' | 'partial',
  diasProcessados: 5,
  equipesProcessadas: 10,
  faltasCriadas: 3,
  horasExtrasCriadas: 2,
  divergenciasCriadas: 1,
  erros: [],
  duracao: '2.5s'
}
```

## Monitoramento

### Métricas
- Tempo de execução
- Número de dias processados
- Número de faltas/horas extras criadas
- Taxa de erro

### Alertas (futuro)
- Job não executou (falha crítica)
- Muitas faltas criadas (anormalidade)
- Tempo de execução muito alto

## Endpoints Administrativos (Opcional)

### Executar Reconciliação Manual
**Endpoint**: `POST /api/admin/turnos-realizados/reconciliar`
**Body**: `{ dataReferencia: string, equipeId?: number }`

### Status do Último Job
**Endpoint**: `GET /api/admin/turnos-realizados/job-status`
**Resposta**: Última execução e status

## Performance

- Processar em batch (todas as equipes de uma vez)
- Usar transações para garantir consistência
- Índices adequados para consultas rápidas
- Limitar processamento a 30 dias (configurável)

## Configuração via Env

```env
# Horário do job (cron)
RECONCILIACAO_CRON='0 23 * * *'

# Margem de atraso (minutos)
RECONCILIACAO_MARGEM_MINUTOS=30

# Dias para processar (histórico)
RECONCILIACAO_DIAS_HISTORICO=30

# Timezone
TZ='America/Sao_Paulo'
```

