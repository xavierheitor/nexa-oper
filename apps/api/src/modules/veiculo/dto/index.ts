/**
 * Arquivo de índice para exportação de todos os DTOs do módulo Veículo
 */

// DTOs principais
export { CreateVeiculoDto } from './create-veiculo.dto';
export { UpdateVeiculoDto } from './update-veiculo.dto';
export {
  VeiculoResponseDto,
  VeiculoTipoVeiculoDto,
  VeiculoContratoDto,
} from './veiculo-response.dto';
export { VeiculoListResponseDto } from './veiculo-list-response.dto';
export { VeiculoQueryDto } from './veiculo-query.dto';

// DTOs de sincronização
export { VeiculoSyncDto } from './veiculo-sync.dto';
