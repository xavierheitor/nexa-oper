export const CONTRACT_PERMISSIONS_READER = Symbol(
  'CONTRACT_PERMISSIONS_READER',
);

export interface UserContractsInfoPort {
  userId: number;
  contracts: number[];
  total: number;
}

export interface ContractPermissionsReaderPort {
  hasContractPermission(userId: number, contractId: number): Promise<boolean>;
  hasAnyContractPermission(
    userId: number,
    contractIds: number[],
  ): Promise<boolean>;
  getUserContracts(userId: number): Promise<UserContractsInfoPort>;
}
