# Fluxos de Negócio: Turnos

## Visão Geral

Módulo `turno` oferece endpoints para abertura, fechamento e consulta de turnos. Há um controller
específico para fluxo mobile.

## Endpoints Principais

- `POST /api/turnos/abrir` — abertura de turno (web)
- `POST /api/turnos/fechar` — fechamento de turno (web)
- `POST /api/turno/abrir` — abertura de turno (mobile)

## Fluxo Web — Abrir Turno

```1:44:apps/api/src/modules/turno/controllers/turno.controller.ts
/**
 * Controlador de Turnos
 */
```

- Controller: `TurnoController.abrirTurno`
- Service: `TurnoService.abrirTurno`
- Validações:
  - Existência de veículo/equipe/eletricistas
  - Conflitos de turno aberto
  - Regras de negócio (ex.: km inicial)

## Fluxo Mobile — Abrir Turno

```44:91:apps/api/src/modules/turno/controllers/turno-mobile.controller.ts
@ApiTags('turno')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@UseInterceptors(ValidationErrorInterceptor)
@Controller('turno')
export class TurnoMobileController {
  ...
}
```

- Controller: `TurnoMobileController.abrirTurnoMobile`
- Service: `TurnoService.abrirTurno`
- Aplicação de fallback `eletricistaRemoteId` em checklists recebidos

## Serviço de Turno

```88:116:apps/api/src/modules/turno/services/turno.service.ts
/**
 * Serviço responsável pelas operações de turnos
 */
```

- Transações com Prisma, validações e auditoria
- Integração com `ChecklistPreenchidoService`

## Sequência (Mobile)

```bash
App Mobile → TurnoMobileController → TurnoService → ChecklistPreenchidoService → Resposta
```

Para detalhes de payloads, ver [PAYLOADS.md](./PAYLOADS.md).
