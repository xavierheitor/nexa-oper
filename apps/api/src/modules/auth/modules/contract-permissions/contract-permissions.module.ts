import { Module } from '@nestjs/common';
import { DatabaseModule } from '../../../../database';
import { GetUserContractsUseCase } from './application/use-cases/get-user-contracts.use-case';
import { HasAnyContractPermissionUseCase } from './application/use-cases/has-any-contract-permission.use-case';
import { HasContractPermissionUseCase } from './application/use-cases/has-contract-permission.use-case';
import { CONTRACT_PERMISSIONS_READER } from './domain/ports/contract-permissions-reader.port';
import { ContractPermissionsService } from './services/contract-permissions.service';
import { ContractPermissionsGuard } from './guards/contract-permissions.guard';
import { UserContractsInterceptor } from './interceptors/user-contracts.interceptor';

@Module({
  imports: [DatabaseModule],
  providers: [
    ContractPermissionsService,
    HasContractPermissionUseCase,
    HasAnyContractPermissionUseCase,
    GetUserContractsUseCase,
    {
      provide: CONTRACT_PERMISSIONS_READER,
      useExisting: ContractPermissionsService,
    },
    ContractPermissionsGuard,
    UserContractsInterceptor,
  ],
  exports: [
    ContractPermissionsService,
    HasContractPermissionUseCase,
    HasAnyContractPermissionUseCase,
    GetUserContractsUseCase,
    ContractPermissionsGuard,
    UserContractsInterceptor,
  ],
})
export class ContractPermissionsModule {}
