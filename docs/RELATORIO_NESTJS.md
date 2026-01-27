# Relatório NestJS (branch atual)

## 1) Estrutura de pastas (backend, até 4 níveis)

```
src/
├── common/
│   ├── circuit-breaker/
│   │   ├── circuit-breaker.module.ts
│   │   ├── circuit-breaker.service.ts
│   │   ├── index.ts
│   │   └── README.md
│   ├── constants/
│   │   ├── apr.ts
│   │   ├── atividade.ts
│   │   ├── checklist-upload.ts
│   │   ├── checklist.ts
│   │   ├── common.constants.ts
│   │   ├── eletricista.ts
│   │   ├── equipe.ts
│   │   ├── errors.ts
│   │   ├── index.ts
│   │   ├── mobile-upload.ts
│   │   ├── README.md
│   │   ├── tipo-equipe.ts
│   │   ├── tipo-veiculo.ts
│   │   ├── turno.ts
│   │   └── veiculo.ts
│   ├── decorators/
│   │   ├── index.ts
│   │   ├── log-operation.decorator.ts
│   │   ├── public.decorator.ts
│   │   └── sync-endpoint.decorator.ts
│   ├── dto/
│   │   ├── pagination-meta.dto.ts
│   │   └── sync-status.dto.ts
│   ├── filters/
│   │   └── all-exceptions.filter.ts
│   ├── interceptors/
│   │   ├── index.ts
│   │   ├── operation-logging.interceptor.ts
│   │   ├── README.md
│   │   ├── sync-audit-remover.interceptor.spec.ts
│   │   ├── sync-audit-remover.interceptor.ts
│   │   └── validation-error.interceptor.ts
│   ├── middleware/
│   │   ├── index.ts
│   │   ├── logger.middleware.ts
│   │   ├── rate-limit.middleware.ts
│   │   └── timeout.middleware.ts
│   ├── storage/
│   │   ├── index.ts
│   │   ├── local-disk-storage.adapter.spec.ts
│   │   ├── local-disk-storage.adapter.ts
│   │   ├── media.service.spec.ts
│   │   ├── media.service.ts
│   │   ├── README.md
│   │   ├── storage.module.spec.ts
│   │   ├── storage.module.ts
│   │   └── storage.port.ts
│   ├── types/
│   │   └── prisma.ts
│   ├── utils/
│   │   ├── audit.ts
│   │   ├── cors.spec.ts
│   │   ├── cors.ts
│   │   ├── date-timezone.ts
│   │   ├── error-handler.ts
│   │   ├── error-response.ts
│   │   ├── job-lock.ts
│   │   ├── logger.spec.ts
│   │   ├── logger.ts
│   │   ├── pagination.ts
│   │   ├── ports.ts
│   │   ├── sync-aggregate.ts
│   │   ├── sync-checksum.ts
│   │   ├── sync-helpers.spec.ts
│   │   ├── sync-params.ts
│   │   ├── sync-payload.ts
│   │   ├── sync-status.ts
│   │   ├── sync-where.ts
│   │   ├── timeout.ts
│   │   ├── upload-validation.spec.ts
│   │   ├── upload-validation.ts
│   │   ├── validation.ts
│   │   └── where-clause.ts
│   ├── index.ts
│   └── README.md
├── config/
│   ├── app.config.ts
│   ├── cors.config.ts
│   ├── index.ts
│   ├── routes.config.ts
│   ├── security.config.ts
│   ├── swagger.config.ts
│   ├── validation.spec.ts
│   └── validation.ts
├── core/
│   ├── auth/
│   │   ├── controllers/
│   │   │   ├── auth.controller.spec.ts
│   │   │   └── auth.controller.ts
│   │   ├── decorators/
│   │   │   ├── contract-permission.decorator.ts
│   │   │   ├── get-user-contracts.decorator.ts
│   │   │   └── get-user-id-decorator.ts
│   │   ├── dto/
│   │   │   ├── login.dto.ts
│   │   │   └── refresh.dto.ts
│   │   ├── guards/
│   │   │   ├── contract-permissions.guard.ts
│   │   │   └── jwt-auth.guard.ts
│   │   ├── services/
│   │   │   ├── auth.service.spec.ts
│   │   │   ├── auth.service.ts
│   │   │   ├── contract-permissions.service.ts
│   │   │   └── jwt.service.ts
│   │   ├── strategies/
│   │   │   ├── jwt.strategy.spec.ts
│   │   │   └── jwt.strategy.ts
│   │   ├── utils/
│   │   │   └── contract-helpers.ts
│   │   └── auth.module.ts
│   ├── contracts/
│   │   ├── controllers/
│   │   │   └── contracts.controller.ts
│   │   └── contracts.module.ts
│   ├── mobile-users/
│   │   ├── services/
│   │   │   ├── mobile-users.service.spec.ts
│   │   │   └── mobile-users.service.ts
│   │   └── mobile-users.module.ts
│   └── web-logs/
│       ├── dto/
│       │   └── web-log.dto.ts
│       ├── web-logs.controller.ts
│       ├── web-logs.module.ts
│       └── web-logs.service.ts
├── database/
│   ├── database.module.ts
│   └── database.service.ts
├── internal/
│   ├── health/
│   │   ├── health.controller.ts
│   │   └── health.module.ts
│   └── reconciliacao/
│       ├── dto/
│       │   ├── force-reconcile.dto.ts
│       │   └── reconcile-response.dto.ts
│       ├── guards/
│       │   └── internal-key.guard.ts
│       ├── internal-reconciliacao.controller.ts
│       ├── internal-reconciliacao.module.ts
│       ├── internal-reconciliacao.service.ts
│       ├── reconciliacao-db.ts
│       ├── reconciliacao-processor.ts
│       ├── reconciliacao.scheduler.ts
│       ├── reconciliacao.utils.ts
│       └── types.ts
├── modules/
│   ├── apr/
│   │   ├── controllers/
│   │   │   ├── apr-sync.controller.ts
│   │   │   └── index.ts
│   │   ├── dto/
│   │   │   ├── apr-list-response.dto.ts
│   │   │   ├── apr-opcao-resposta-relacao-sync.dto.ts
│   │   │   ├── apr-opcao-resposta-sync.dto.ts
│   │   │   ├── apr-pergunta-relacao-sync.dto.ts
│   │   │   ├── apr-pergunta-sync.dto.ts
│   │   │   ├── apr-query.dto.ts
│   │   │   ├── apr-response.dto.ts
│   │   │   ├── apr-tipo-atividade-relacao-sync.dto.ts
│   │   │   └── index.ts
│   │   ├── services/
│   │   │   ├── apr-sync.service.ts
│   │   │   ├── apr.service.ts
│   │   │   └── index.ts
│   │   ├── apr.module.ts
│   │   └── README.md
│   ├── atividade/
│   │   ├── controllers/
│   │   │   ├── index.ts
│   │   │   ├── tipo-atividade-sync.controller.ts
│   │   │   └── tipo-atividade.controller.ts
│   │   ├── dto/
│   │   │   ├── create-tipo-atividade.dto.ts
│   │   │   ├── index.ts
│   │   │   ├── tipo-atividade-list-response.dto.ts
│   │   │   ├── tipo-atividade-query.dto.ts
│   │   │   ├── tipo-atividade-response.dto.ts
│   │   │   ├── tipo-atividade-sync.dto.ts
│   │   │   └── update-tipo-atividade.dto.ts
│   │   ├── services/
│   │   │   ├── index.ts
│   │   │   └── tipo-atividade.service.ts
│   │   ├── atividade.module.ts
│   │   ├── index.ts
│   │   └── README.md
│   ├── checklist/
│   │   ├── controllers/
│   │   │   ├── checklist-sync.controller.ts
│   │   │   ├── checklist.controller.ts
│   │   │   └── index.ts
│   │   ├── dto/
│   │   │   ├── checklist-list-response.dto.ts
│   │   │   ├── checklist-opcao-resposta-relacao-sync.dto.ts
│   │   │   ├── checklist-opcao-resposta-sync.dto.ts
│   │   │   ├── checklist-pergunta-relacao-sync.dto.ts
│   │   │   ├── checklist-pergunta-sync.dto.ts
│   │   │   ├── checklist-query.dto.ts
│   │   │   ├── checklist-response.dto.ts
│   │   │   ├── checklist-tipo-equipe-relacao-sync.dto.ts
│   │   │   ├── checklist-tipo-veiculo-relacao-sync.dto.ts
│   │   │   ├── create-checklist.dto.ts
│   │   │   ├── index.ts
│   │   │   └── update-checklist.dto.ts
│   │   ├── services/
│   │   │   ├── checklist-sync.service.ts
│   │   │   ├── checklist.service.ts
│   │   │   └── index.ts
│   │   ├── checklist.module.ts
│   │   └── README.md
│   ├── eletricista/
│   │   ├── controllers/
│   │   │   ├── eletricista-sync.controller.ts
│   │   │   └── index.ts
│   │   ├── dto/
│   │   │   ├── create-eletricista.dto.ts
│   │   │   ├── eletricista-list-response.dto.ts
│   │   │   ├── eletricista-query.dto.ts
│   │   │   ├── eletricista-response.dto.ts
│   │   │   ├── eletricista-sync.dto.ts
│   │   │   ├── index.ts
│   │   │   └── update-eletricista.dto.ts
│   │   ├── services/
│   │   │   ├── eletricista-sync.service.ts
│   │   │   ├── eletricista.service.ts
│   │   │   └── index.ts
│   │   ├── eletricista.module.ts
│   │   └── README.md
│   ├── equipe/
│   │   ├── controllers/
│   │   │   ├── equipe-sync.controller.ts
│   │   │   ├── index.ts
│   │   │   ├── tipo-equipe-sync.controller.ts
│   │   │   └── tipo-equipe.controller.ts
│   │   ├── dto/
│   │   │   ├── create-equipe.dto.ts
│   │   │   ├── create-tipo-equipe.dto.ts
│   │   │   ├── equipe-list-response.dto.ts
│   │   │   ├── equipe-response.dto.ts
│   │   │   ├── equipe-sync.dto.ts
│   │   │   ├── index.ts
│   │   │   ├── tipo-equipe-list-response.dto.ts
│   │   │   ├── tipo-equipe-query.dto.ts
│   │   │   ├── tipo-equipe-response.dto.ts
│   │   │   ├── tipo-equipe-sync.dto.ts
│   │   │   ├── update-equipe.dto.ts
│   │   │   └── update-tipo-equipe.dto.ts
│   │   ├── services/
│   │   │   ├── equipe-sync.service.ts
│   │   │   ├── equipe.service.ts
│   │   │   └── tipo-equipe.service.ts
│   │   ├── equipe.module.ts
│   │   ├── index.ts
│   │   └── README.md
│   ├── mobile-upload/
│   │   ├── controllers/
│   │   │   ├── index.ts
│   │   │   ├── mobile-location-upload.controller.ts
│   │   │   └── mobile-photo-upload.controller.ts
│   │   ├── dto/
│   │   │   ├── index.ts
│   │   │   ├── location-upload-response.dto.ts
│   │   │   ├── location-upload.dto.ts
│   │   │   ├── photo-upload-response.dto.ts
│   │   │   └── photo-upload.dto.ts
│   │   ├── services/
│   │   │   ├── foto-pendencia-processor.service.spec.ts
│   │   │   ├── foto-pendencia-processor.service.ts
│   │   │   ├── index.ts
│   │   │   ├── mobile-location-upload.service.spec.ts
│   │   │   ├── mobile-location-upload.service.ts
│   │   │   ├── mobile-photo-upload.service.spec.ts
│   │   │   └── mobile-photo-upload.service.ts
│   │   ├── index.ts
│   │   └── mobile-upload.module.ts
│   ├── turno/
│   │   ├── controllers/
│   │   │   ├── checklist-foto.controller.ts
│   │   │   ├── index.ts
│   │   │   ├── turno-mobile.controller.ts
│   │   │   ├── turno-sync.controller.ts
│   │   │   └── turno.controller.ts
│   │   ├── cqrs/
│   │   │   ├── commands/
│   │   │   │   ├── close-turno.command.ts
│   │   │   │   ├── create-turno.command.ts
│   │   │   │   └── delete-turno.command.ts
│   │   │   ├── handlers/
│   │   │   │   ├── close-turno.handler.ts
│   │   │   │   ├── create-turno.handler.ts
│   │   │   │   ├── delete-turno.handler.ts
│   │   │   │   ├── get-turno-by-id.handler.ts
│   │   │   │   ├── get-turnos-for-sync.handler.ts
│   │   │   │   └── get-turnos.handler.ts
│   │   │   ├── queries/
│   │   │   │   ├── get-turno-by-id.query.ts
│   │   │   │   ├── get-turnos-for-sync.query.ts
│   │   │   │   └── get-turnos.query.ts
│   │   │   └── index.ts
│   │   ├── dto/
│   │   │   ├── abrir-turno.dto.ts
│   │   │   ├── checklist-foto.dto.ts
│   │   │   ├── checklist-preenchido.dto.ts
│   │   │   ├── checklist-resposta.dto.ts
│   │   │   ├── fechar-turno.dto.ts
│   │   │   ├── index.ts
│   │   │   ├── mobile-abrir-turno.dto.ts
│   │   │   ├── mobile-fechar-turno.dto.ts
│   │   │   ├── turno-list-response.dto.ts
│   │   │   ├── turno-query.dto.ts
│   │   │   ├── turno-response.dto.ts
│   │   │   └── turno-sync.dto.ts
│   │   ├── events/
│   │   │   ├── handlers/
│   │   │   │   └── turno-event.handler.ts
│   │   │   ├── index.ts
│   │   │   ├── turno-closed.event.ts
│   │   │   ├── turno-created.event.ts
│   │   │   ├── turno-deleted.event.ts
│   │   │   └── turno-updated.event.ts
│   │   ├── examples/
│   │   │   └── circuit-breaker-example.ts
│   │   ├── services/
│   │   │   ├── checklist-foto.service.spec.ts
│   │   │   ├── checklist-foto.service.ts
│   │   │   ├── checklist-preenchido.service.ts
│   │   │   ├── index.ts
│   │   │   └── turno.service.ts
│   │   ├── CQRS_EVENT_SOURCING_CIRCUIT_BREAKER.md
│   │   ├── index.ts
│   │   ├── README.md
│   │   └── turno.module.ts
│   ├── turno-realizado/
│   │   ├── dto/
│   │   │   ├── aprovar-hora-extra.dto.ts
│   │   │   ├── consolidado-eletricista-query.dto.ts
│   │   │   ├── consolidado-equipe-query.dto.ts
│   │   │   ├── falta-filter.dto.ts
│   │   │   ├── hora-extra-filter.dto.ts
│   │   │   ├── reconciliar-forcado.dto.ts
│   │   │   └── reconciliar-manual.dto.ts
│   │   ├── guards/
│   │   │   └── localhost-cors.guard.ts
│   │   ├── turno-realizado.controller.ts
│   │   ├── turno-realizado.module.ts
│   │   └── turno-realizado.service.ts
│   └── veiculo/
│       ├── controllers/
│       │   ├── index.ts
│       │   ├── tipo-veiculo-sync.controller.ts
│       │   ├── tipo-veiculo.controller.ts
│       │   ├── veiculo-sync.controller.ts
│       │   └── veiculo.controller.ts
│       ├── dto/
│       │   ├── create-tipo-veiculo.dto.ts
│       │   ├── create-veiculo.dto.ts
│       │   ├── index.ts
│       │   ├── tipo-veiculo-list-response.dto.ts
│       │   ├── tipo-veiculo-query.dto.ts
│       │   ├── tipo-veiculo-response.dto.ts
│       │   ├── tipo-veiculo-sync.dto.ts
│       │   ├── update-tipo-veiculo.dto.ts
│       │   ├── update-veiculo.dto.ts
│       │   ├── veiculo-list-response.dto.ts
│       │   ├── veiculo-query.dto.ts
│       │   ├── veiculo-response.dto.ts
│       │   └── veiculo-sync.dto.ts
│       ├── services/
│       │   ├── index.ts
│       │   ├── tipo-veiculo.service.ts
│       │   ├── veiculo-queries.ts
│       │   ├── veiculo-selects.ts
│       │   ├── veiculo-where.ts
│       │   └── veiculo.service.ts
│       ├── index.ts
│       ├── README.md
│       └── veiculo.module.ts
├── types/
│   └── multer.d.ts
├── utils/
│   └── graceful-shutdown.ts
├── app.controller.spec.ts
├── app.controller.ts
├── app.module.ts
├── app.service.ts
├── main.ts
└── test-setup.ts
```

## 2) Módulos NestJS (*.module.ts) com imports/controllers/providers

- **AppModule**
  - **imports:** ConfigModule.forRoot, ScheduleModule.forRoot, EventEmitterModule.forRoot, DatabaseModule, AprModule, ChecklistModule, VeiculoModule, EletricistaModule, EquipeModule, AtividadeModule, TurnoModule, AuthModule, ContractsModule, MobileUploadModule, HealthModule, TurnoRealizadoModule, WebLogsModule, InternalReconciliacaoModule.
  - **controllers:** AppController.
  - **providers:** AppService; APP_INTERCEPTOR -> OperationLoggingInterceptor.

- **DatabaseModule**
  - **imports:** (nenhum)
  - **controllers:** (nenhum)
  - **providers:** DatabaseService; PrismaClient (via factory do DatabaseService).

- **CircuitBreakerModule**
  - **imports:** (nenhum)
  - **controllers:** (nenhum)
  - **providers:** CircuitBreakerService.

- **StorageModule**
  - **imports:** (nenhum)
  - **controllers:** (nenhum)
  - **providers:** STORAGE_PORT -> LocalDiskStorageAdapter; MediaService (via forRoot).

- **MobileUploadModule**
  - **imports:** DatabaseModule, AuthModule, StorageModule.forRoot (rootPath/publicPrefix), MulterModule.register (memoryStorage).
  - **controllers:** MobilePhotoUploadController, MobileLocationUploadController.
  - **providers:** FotoPendenciaProcessorService, MobilePhotoUploadService, MobileLocationUploadService.

- **VeiculoModule**
  - **imports:** DatabaseModule, AuthModule.
  - **controllers:** VeiculoSyncController, VeiculoController, TipoVeiculoController, TipoVeiculoSyncController.
  - **providers:** VeiculoService, TipoVeiculoService.

- **TurnoModule**
  - **imports:** DatabaseModule, AuthModule, TurnoRealizadoModule, CqrsModule, EventEmitterModule, StorageModule.forRoot (checklist uploads), MulterModule.register.
  - **controllers:** TurnoController, TurnoSyncController, TurnoMobileController, ChecklistFotoController.
  - **providers:** TurnoService, ChecklistPreenchidoService, ChecklistFotoService, CreateTurnoHandler, CloseTurnoHandler, DeleteTurnoHandler, GetTurnosHandler, GetTurnoByIdHandler, GetTurnosForSyncHandler, TurnoEventHandler.

- **TurnoRealizadoModule**
  - **imports:** DatabaseModule.
  - **controllers:** TurnoRealizadoController.
  - **providers:** TurnoRealizadoService, LocalhostCorsGuard.

- **ChecklistModule**
  - **imports:** DatabaseModule, AuthModule.
  - **controllers:** ChecklistSyncController, ChecklistController.
  - **providers:** ChecklistService, ChecklistSyncService.

- **EletricistaModule**
  - **imports:** DatabaseModule, AuthModule.
  - **controllers:** EletricistaSyncController.
  - **providers:** EletricistaService, EletricistaSyncService.

- **AtividadeModule**
  - **imports:** DatabaseModule, AuthModule.
  - **controllers:** TipoAtividadeController, TipoAtividadeSyncController.
  - **providers:** TipoAtividadeService.

- **EquipeModule**
  - **imports:** DatabaseModule, AuthModule.
  - **controllers:** EquipeSyncController, TipoEquipeController, TipoEquipeSyncController.
  - **providers:** EquipeService, EquipeSyncService, TipoEquipeService.

- **AprModule**
  - **imports:** DatabaseModule, AuthModule.
  - **controllers:** AprSyncController.
  - **providers:** AprService, AprSyncService.

- **HealthModule**
  - **imports:** DatabaseModule.
  - **controllers:** HealthController.
  - **providers:** (nenhum).

- **InternalReconciliacaoModule**
  - **imports:** DatabaseModule.
  - **controllers:** InternalReconciliacaoController.
  - **providers:** InternalReconciliacaoService, InternalKeyGuard, ReconciliacaoScheduler.

- **AuthModule**
  - **imports:** DatabaseModule, MobileUsersModule, PassportModule, JwtModule.registerAsync.
  - **controllers:** AuthController.
  - **providers:** AuthService, JwtStrategy, ContractPermissionsService, ContractPermissionsGuard.

- **MobileUsersModule**
  - **imports:** DatabaseModule.
  - **controllers:** (nenhum).
  - **providers:** MobileUsersService.

- **ContractsModule**
  - **imports:** AuthModule.
  - **controllers:** ContractsController.
  - **providers:** (nenhum).

- **WebLogsModule**
  - **imports:** (nenhum).
  - **controllers:** WebLogsController.
  - **providers:** WebLogsService.

## 3) Controllers e Services por módulo + tamanho aproximado

> Linhas aproximadas com base em `wc -l` (varia conforme formatação).

- **AppModule**
  - Controllers: AppController (~170)
  - Services: AppService (~187)

- **DatabaseModule**
  - Services: DatabaseService (~108)

- **CircuitBreakerModule**
  - Services: CircuitBreakerService (~249)

- **StorageModule**
  - Services: MediaService (~75)

- **MobileUploadModule**
  - Controllers: MobilePhotoUploadController (~141), MobileLocationUploadController (~83)
  - Services: FotoPendenciaProcessorService (~512), MobilePhotoUploadService (~330), MobileLocationUploadService (~144)

- **VeiculoModule**
  - Controllers: VeiculoController (~289), VeiculoSyncController (~64), TipoVeiculoController (~113), TipoVeiculoSyncController (~45)
  - Services: VeiculoService (~295), TipoVeiculoService (~242)

- **TurnoModule**
  - Controllers: TurnoController (~449), TurnoSyncController (~101), TurnoMobileController (~427), ChecklistFotoController (~353)
  - Services: TurnoService (~1081), ChecklistPreenchidoService (~520), ChecklistFotoService (~381)

- **TurnoRealizadoModule**
  - Controllers: TurnoRealizadoController (~152)
  - Services: TurnoRealizadoService (~975)

- **ChecklistModule**
  - Controllers: ChecklistController (~225), ChecklistSyncController (~290)
  - Services: ChecklistService (~240), ChecklistSyncService (~365)

- **EletricistaModule**
  - Controllers: EletricistaSyncController (~111)
  - Services: EletricistaService (~297), EletricistaSyncService (~120)

- **AtividadeModule**
  - Controllers: TipoAtividadeController (~359), TipoAtividadeSyncController (~102)
  - Services: TipoAtividadeService (~496)

- **EquipeModule**
  - Controllers: EquipeSyncController (~105), TipoEquipeController (~302), TipoEquipeSyncController (~64)
  - Services: EquipeService (~284), EquipeSyncService (~110), TipoEquipeService (~282)

- **AprModule**
  - Controllers: AprSyncController (~348)
  - Services: AprService (~302), AprSyncService (~286)

- **HealthModule**
  - Controllers: HealthController (~43)

- **InternalReconciliacaoModule**
  - Controllers: InternalReconciliacaoController (~55)
  - Services: InternalReconciliacaoService (~393)

- **AuthModule**
  - Controllers: AuthController (~170)
  - Services: AuthService (~246), ContractPermissionsService (~407), JwtService (~25)

- **MobileUsersModule**
  - Services: MobileUsersService (~19)

- **ContractsModule**
  - Controllers: ContractsController (~365)

- **WebLogsModule**
  - Controllers: WebLogsController (~44)
  - Services: WebLogsService (~66)

## 4) Locais onde Prisma é usado diretamente

> Resultado da busca por `this.prisma` e `prisma.` (inclui usos diretos e exemplos em comentários).

- **database/database.service.ts** — uso direto de `this.prisma` para conexão/queries/healthcheck.
- **common/utils/job-lock.ts** — utilitário de lock com `prisma.jobLock`.
- **common/utils/validation.ts** — exemplos com `prisma` em comentários e uso genérico com client.
- **common/types/prisma.ts** — exemplo em comentário e definição de tipo de transação.
- **modules/apr/services/apr-sync.service.ts** — agregações e findMany com `prisma.*`.
- **modules/checklist/services/checklist-sync.service.ts** — agregações e findMany com `prisma.*`.
- **modules/turno/services/checklist-preenchido.service.ts** — criação e consultas com `prisma.*`.
- **modules/turno-realizado/turno-realizado.service.ts** — transações e updates com `prisma.*`.
- **modules/mobile-upload/services/mobile-location-upload.service.ts** — create/find com `prisma.*`.
- **modules/veiculo/services/veiculo-queries.ts** — queries com `prisma.*`.
- **internal/reconciliacao/reconciliacao-db.ts** — acesso direto a `prisma.*` em funções utilitárias.

## 5) Locais de código duplicado (padrões repetidos)

- **Controllers de sincronização** repetem padrão `status + checksum + validateSince + logger` e endpoints `sync/*`.
  - Ex.: `AprSyncController` e `ChecklistSyncController` possuem endpoints `status`, `modelos` e `perguntas` com validação de `since` e chamadas para service equivalentes.
- **Services de sincronização** repetem padrão de `buildSyncChecksumPayload`, `getSyncStatus` e `findAll*ForSync`.
  - Ex.: `AprSyncService` e `ChecklistSyncService` fazem agregações e `findMany` similares com `buildSyncStatusResponse`.
- **Controllers CRUD** (tipos) têm estrutura muito parecida (listagem paginada, count, create, update, delete, findOne) e uso de `ApiQuery`/`ApiResponse`.
  - Ex.: `TipoAtividadeController`, `TipoEquipeController` e `TipoVeiculoController`.
- **Services CRUD** (tipos) repetem padrão de paginação/validação/auditoria (findAll, findById, create, update, remove).
  - Ex.: `TipoAtividadeService` e `TipoEquipeService` com `buildPaginationMeta`, `validatePaginationParams` e `db.getPrisma().*.findMany`.

## 6) Pontos de responsabilidade misturada (upload + regra de negócio + sync)

- **MobilePhotoUploadService** mistura:
  - validação e persistência de arquivo (MediaService),
  - persistência de metadados (Prisma),
  - e regra de negócio de pendências (chama `FotoPendenciaProcessorService`).
- **ChecklistFotoService** concentra:
  - sync/upload de fotos,
  - persistência em storage e banco,
  - e atualização de pendências/respostas (regras de negócio).
- **TurnoService** acumula:
  - regras de negócio (abrir/fechar, validações),
  - operações de sync (`findAllForSync`),
  - e integrações com outros serviços (ChecklistPreenchidoService/TurnoRealizadoService).

## 7) Sugestão de arquitetura alvo (feature-first + camadas)

**Objetivo:** modularizar por feature com camadas claras e reduzir acoplamento (especialmente em serviços muito grandes).

### Estrutura sugerida

```
src/
├── modules/
│   ├── turno/
│   │   ├── application/
│   │   │   ├── use-cases/
│   │   │   ├── dto/
│   │   │   └── services/
│   │   ├── domain/
│   │   │   ├── entities/
│   │   │   ├── value-objects/
│   │   │   └── services/
│   │   ├── infra/
│   │   │   ├── prisma/
│   │   │   ├── repositories/
│   │   │   └── mappers/
│   │   ├── presentation/
│   │   │   ├── controllers/
│   │   │   └── guards/
│   │   └── turno.module.ts
│   └── ...
```

### Princípios
- **Feature-first**: cada domínio (turno, checklist, equipe, etc.) encapsula controllers, services e repos.
- **Application layer**: casos de uso e orquestração (ex.: abrir/fechar turno, sincronizações).
- **Domain layer**: regras e invariantes do negócio (ex.: validações de conflito, políticas de pendência).
- **Infra layer**: Prisma repositories, storage adapters e integrações.

## 8) Plano de refatoração em etapas pequenas (seguro para produção)

### Etapa 1 — Mapear e estabilizar contratos públicos
- **O que fazer:** documentar contratos HTTP e eventos (Swagger + exemplos), adicionando testes de contrato básicos.
- **Como testar:** smoke tests com `GET /health` e chamadas de sync (status + modelos) nos módulos mais críticos.

### Etapa 2 — Extrair repositórios Prisma por feature
- **O que fazer:** criar `infra/prisma` com repositórios por módulo (ex.: `TurnoRepository`).
- **Como testar:** unit tests de repository (mock Prisma), além de testes de serviço existentes.

### Etapa 3 — Isolar casos de uso (application)
- **O que fazer:** mover lógica de negócio para use-cases (ex.: `AbrirTurnoUseCase`, `FecharTurnoUseCase`, `SyncChecklistsUseCase`).
- **Como testar:** testes unitários de use-case e regression tests dos controllers.

### Etapa 4 — Separar concerns de upload/sync
- **O que fazer:** separar upload físico de regras de negócio (ex.: `UploadService` vs. `PendenciaService`).
- **Como testar:** testes unitários de validação/processing + teste de integração de upload.

### Etapa 5 — Padronizar sync controllers/services
- **O que fazer:** criar base abstractions (ex.: `SyncControllerBase`, `SyncServiceBase`) ou helpers compartilhados.
- **Como testar:** validação com testes de contrato por endpoint `sync/*`.

### Etapa 6 — Revisar erros e observabilidade
- **O que fazer:** padronizar erros (uma camada de `DomainError`) e centralizar logs.
- **Como testar:** testes unitários para mapping de erros e auditoria.

### Etapa 7 — Otimizar serviços grandes
- **O que fazer:** dividir `TurnoService`, `TurnoRealizadoService` e `FotoPendenciaProcessorService` por casos de uso.
- **Como testar:** regressão com testes existentes + cenários críticos (abrir/fechar turno, sincronizações, pendências).

---

# Top 10 arquivos mais críticos (complexidade/acoplamento)

1. `modules/turno/services/turno.service.ts`
2. `modules/turno-realizado/turno-realizado.service.ts`
3. `modules/mobile-upload/services/foto-pendencia-processor.service.ts`
4. `modules/turno/services/checklist-preenchido.service.ts`
5. `modules/atividade/services/tipo-atividade.service.ts`
6. `core/auth/services/contract-permissions.service.ts`
7. `internal/reconciliacao/internal-reconciliacao.service.ts`
8. `modules/turno/controllers/turno.controller.ts`
9. `modules/turno/controllers/turno-mobile.controller.ts`
10. `modules/turno/controllers/checklist-foto.controller.ts`

# Top 10 refactors com maior retorno

1. **Extrair repositories Prisma por feature** (reduz acoplamento e duplicação de queries).
2. **Criar camada de use-cases** para fluxos críticos (ex.: abrir/fechar turno).
3. **Padronizar sync controllers/services** com helpers compartilhados.
4. **Separar upload/storage de regras de negócio** (mobile upload + pendências + checklist foto).
5. **Quebrar serviços monolíticos** (TurnoService, TurnoRealizadoService, FotoPendenciaProcessorService).
6. **Centralizar validações repetidas** (pagination, `validateSince`, `ensureEntityExists`).
7. **Definir contratos DTO de sync** reutilizáveis com typed mappers.
8. **Criar domínio de “pendências”** isolado (regras e eventos próprios).
9. **Adicionar testes de contrato/smoke para endpoints sync** (protege refactors).
10. **Revisar padrões de auditoria/logging** para reduzir boilerplate e uniformizar logs.
