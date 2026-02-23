import { Inject, Injectable } from '@nestjs/common';
import {
  CONTRACT_PERMISSIONS_READER,
  type ContractPermissionsReaderPort,
} from '../../domain/ports/contract-permissions-reader.port';

@Injectable()
export class HasContractPermissionUseCase {
  constructor(
    @Inject(CONTRACT_PERMISSIONS_READER)
    private readonly reader: ContractPermissionsReaderPort,
  ) {}

  execute(userId: number, contractId: number): Promise<boolean> {
    return this.reader.hasContractPermission(userId, contractId);
  }
}
