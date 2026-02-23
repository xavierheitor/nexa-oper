import { applyDecorators, UseInterceptors } from '@nestjs/common';
import { UserContractsInterceptor } from '../interceptors/user-contracts.interceptor';

/**
 * Injeta os contratos do usuário no contexto da requisição.
 * Popula request.userContracts e request.userContractsInfo para uso com
 * @GetUserContracts() e @GetUserContractsInfo().
 */
export const InjectUserContracts = () =>
  applyDecorators(UseInterceptors(UserContractsInterceptor));
