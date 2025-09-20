/**
 * Arquivo de índice principal do módulo Turno
 *
 * Este arquivo centraliza todas as exportações do módulo Turno,
 * facilitando a importação em outros módulos e mantendo a organização.
 */

// Módulo principal
export { TurnoModule } from './turno.module';

// Services
export { TurnoService } from './services';

// Controllers
export { TurnoController, TurnoSyncController } from './controllers';

// DTOs
export {
  AbrirTurnoDto,
  EletricistaTurnoDto,
  FecharTurnoDto,
  TurnoResponseDto,
  EletricistaTurnoResponseDto,
  TurnoListResponseDto,
  TurnoQueryDto,
  TurnoSyncDto,
  EletricistaTurnoSyncDto,
} from './dto';

// Constantes
export { ORDER_CONFIG, ERROR_MESSAGES, TURNO_VALIDATION_CONFIG, TURNO_STATUS } from './constants';
