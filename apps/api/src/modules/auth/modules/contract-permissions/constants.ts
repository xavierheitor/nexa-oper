export const CONTRACT_PERMISSION_KEY = 'contract_permission';

export type ContractPermissionMode = 'single' | 'any' | 'all';

export interface ContractPermissionOptions {
  paramName: string;
  mode: ContractPermissionMode;
  required?: boolean;
  bodyPath?: string;
}

export const LIST_USER_CONTRACTS_KEY = 'list_user_contracts';
