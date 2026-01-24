/**
 * Arquivo de índice principal do módulo Equipe
 *
 * Exporta todos os componentes públicos do módulo para facilitar
 * a importação em outros módulos da aplicação.
 */

// Módulo principal
export { EquipeModule } from './equipe.module';

// Serviços
export { EquipeService } from './services/equipe.service';
export { TipoEquipeService } from './services/tipo-equipe.service';

// Controllers
export {
  EquipeSyncController,
  TipoEquipeController,
  TipoEquipeSyncController,
} from './controllers';

// DTOs
export {
  CreateEquipeDto,
  UpdateEquipeDto,
  EquipeResponseDto,
  EquipeListResponseDto,
  EquipeSyncDto,
  CreateTipoEquipeDto,
  UpdateTipoEquipeDto,
  TipoEquipeResponseDto,
  TipoEquipeListResponseDto,
  TipoEquipeQueryDto,
  OrderDirection,
  TipoEquipeSyncDto,
} from './dto';

// Constantes
export { ORDER_CONFIG, ERROR_MESSAGES } from '@common/constants/equipe';
