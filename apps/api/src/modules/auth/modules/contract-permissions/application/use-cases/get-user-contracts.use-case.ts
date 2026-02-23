import { Inject, Injectable } from '@nestjs/common';
import {
  CONTRACT_PERMISSIONS_READER,
  type ContractPermissionsReaderPort,
  type UserContractsInfoPort,
} from '../../domain/ports/contract-permissions-reader.port';

@Injectable()
export class GetUserContractsUseCase {
  constructor(
    @Inject(CONTRACT_PERMISSIONS_READER)
    private readonly reader: ContractPermissionsReaderPort,
  ) {}

  execute(userId: number): Promise<UserContractsInfoPort> {
    return this.reader.getUserContracts(userId);
  }
}
