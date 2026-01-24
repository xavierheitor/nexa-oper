/**
 * Arquivo de índice principal do módulo Veículo
 *
 * Exporta todos os componentes públicos do módulo para facilitar
 * a importação em outros módulos da aplicação.
 */

// Módulo principal
export { VeiculoModule } from './veiculo.module';

// Serviços
export { VeiculoService } from './services/veiculo.service';
export { TipoVeiculoService } from './services/tipo-veiculo.service';

// Controllers
export {
  VeiculoController,
  VeiculoSyncController,
  TipoVeiculoController,
  TipoVeiculoSyncController,
} from './controllers';

// DTOs
export {
  CreateVeiculoDto,
  UpdateVeiculoDto,
  VeiculoResponseDto,
  VeiculoTipoVeiculoDto,
  VeiculoContratoDto,
  VeiculoListResponseDto,
  VeiculoQueryDto,
  VeiculoSyncDto,
  CreateTipoVeiculoDto,
  UpdateTipoVeiculoDto,
  TipoVeiculoResponseDto,
  TipoVeiculoListResponseDto,
  TipoVeiculoQueryDto,
  OrderDirection,
  TipoVeiculoSyncDto,
} from './dto';

// Constantes
export {
  ORDER_CONFIG,
  ERROR_MESSAGES,
  VEICULO_VALIDATION_CONFIG,
} from '@common/constants/veiculo';
