/**
 * Arquivo de índice principal do módulo Atividade
 *
 * Este arquivo centraliza todas as exportações do módulo Atividade,
 * facilitando a importação em outros módulos e mantendo a organização.
 */

// Módulo principal
export { AtividadeModule } from './atividade.module';

// Services
export { TipoAtividadeService } from './services';

// Controllers
export {
  TipoAtividadeController,
  TipoAtividadeSyncController,
} from './controllers';

// DTOs
export {
  CreateTipoAtividadeDto,
  UpdateTipoAtividadeDto,
  TipoAtividadeResponseDto,
  TipoAtividadeListResponseDto,
  TipoAtividadeQueryDto,
  TipoAtividadeSyncDto,
} from './dto';

// Constantes
export {
  ORDER_CONFIG,
  ERROR_MESSAGES,
  ATIVIDADE_VALIDATION_CONFIG,
} from '@common/constants/atividade';
