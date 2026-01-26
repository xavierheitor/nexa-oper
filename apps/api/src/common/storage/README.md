# Storage

**StoragePort** é a porta (interface) de armazenamento de arquivos: `put`, `delete`, `getPublicUrl`. **LocalDiskStorageAdapter** é a implementação em disco local (grava em `rootPath`, monta URLs com `publicPrefix`). **StorageModule** centraliza a injeção da porta: `forRoot({ rootPath, publicPrefix })` registra e exporta `STORAGE_PORT` com uma instância de `LocalDiskStorageAdapter`. Módulos como Turno e MobileUpload importam `StorageModule.forRoot(...)` e injetam `STORAGE_PORT` nos serviços.

## Uso

```typescript
import { StorageModule } from '@common/storage/storage.module';

@Module({
  imports: [
    StorageModule.forRoot({ rootPath: '/tmp/uploads', publicPrefix: '/uploads' }),
  ],
})
export class MeuModulo {}
```

## Testes

**StoragePort** é uma abstração (porta); em testes unitários pode ser mockada injetando um objeto com `put`, `delete` e `getPublicUrl` — evita gravação em disco e acelera os testes.
