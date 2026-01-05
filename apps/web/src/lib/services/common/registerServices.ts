/**
 * Registro de Serviços no Container
 *
 * Este arquivo centraliza o registro de todos os serviços
 * no container de injeção de dependência, facilitando
 * a configuração e manutenção dos serviços.
 *
 * FUNCIONALIDADES:
 * - Registro centralizado de serviços
 * - Configuração de dependências
 * - Facilita testes unitários
 * - Melhora manutenibilidade
 *
 * COMO USAR:
 * ```typescript
 * // Importar e executar o registro
 * import './registerServices';
 *
 * // Usar o container
 * const contratoService = container.get<ContratoService>('contratoService');
 * ```
 */

import { AprOpcaoRespostaService } from '../apr/AprOpcaoRespostaService';
import { AprPerguntaService } from '../apr/AprPerguntaService';
import { AprService } from '../apr/AprService';
import { AprTipoAtividadeVinculoService } from '../apr/AprTipoAtividadeVinculoService';
import { ChecklistOpcaoRespostaService } from '../checklist/ChecklistOpcaoRespostaService';
import { ChecklistPerguntaService } from '../checklist/ChecklistPerguntaService';
import { ChecklistService } from '../checklist/ChecklistService';
import { ChecklistTipoEquipeVinculoService } from '../checklist/ChecklistTipoEquipeVinculoService';
import { ChecklistTipoVeiculoVinculoService } from '../checklist/ChecklistTipoVeiculoVinculoService';
import { ChecklistPendenciaService } from '../checklist/ChecklistPendenciaService';
import { ContratoService } from '../catalogo/ContratoService';
import { TipoAtividadeService } from '../catalogo/TipoAtividadeService';
import { BaseService } from '../infraestrutura/BaseService';
import { EquipeService } from '../infraestrutura/EquipeService';
import { EquipeSupervisorService } from '../infraestrutura/EquipeSupervisorService';
import { TipoEquipeService } from '../infraestrutura/TipoEquipeService';
import { TipoVeiculoService } from '../infraestrutura/TipoVeiculoService';
import { VeiculoService } from '../infraestrutura/VeiculoService';
import { CargoService } from '../pessoas/CargoService';
import { EletricistaService } from '../pessoas/EletricistaService';
import { SupervisorService } from '../pessoas/SupervisorService';
import { MobileUserService } from '../auth/MobileUserService';
import { UserService } from '../auth/UserService';
import { TipoChecklistService } from '../checklist/TipoChecklistService';
// Módulo de Escalas
import { TipoEscalaService } from '../escala/TipoEscalaService';
import { EscalaEquipePeriodoService } from '../escala/EscalaEquipePeriodoService';
import { EquipeHorarioVigenciaService } from '../escala/EquipeHorarioVigenciaService';
import { HorarioAberturaCatalogoService } from '../escala/HorarioAberturaCatalogoService';
import { EquipeTurnoHistoricoService } from '../escala/EquipeTurnoHistoricoService';
import { TurnoService } from '../turnos/TurnoService';
import { JustificativaEquipeService } from '../justificativas/JustificativaEquipeService';
import { JustificativaService } from '../justificativas/JustificativaService';
import { TipoJustificativaService } from '../justificativas/TipoJustificativaService';
import { FaltaService } from '../turnos/FaltaService';
import { HoraExtraService } from '../turnos/HoraExtraService';
import { container } from './ServiceContainer';

/**
 * Registra todos os serviços no container
 *
 * Esta função deve ser chamada na inicialização da aplicação
 * para configurar todos os serviços e suas dependências.
 */
export function registerServices(): void {
  // Registra serviços de domínio
  container.register('contratoService', () => new ContratoService());
  container.register('baseService', () => new BaseService());
  container.register('cargoService', () => new CargoService());
  container.register('tipoEquipeService', () => new TipoEquipeService());
  container.register('equipeService', () => new EquipeService());
  container.register('tipoVeiculoService', () => new TipoVeiculoService());
  container.register('veiculoService', () => new VeiculoService());
  container.register('eletricistaService', () => new EletricistaService());
  container.register('supervisorService', () => new SupervisorService());
  container.register(
    'equipeSupervisorService',
    () => new EquipeSupervisorService()
  );
  container.register(
    'aprOpcaoRespostaService',
    () => new AprOpcaoRespostaService()
  );
  container.register('aprPerguntaService', () => new AprPerguntaService());
  container.register('aprService', () => new AprService());
  container.register(
    'aprTipoAtividadeVinculoService',
    () => new AprTipoAtividadeVinculoService()
  );
  container.register(
    'checklistPerguntaService',
    () => new ChecklistPerguntaService()
  );
  container.register(
    'checklistOpcaoRespostaService',
    () => new ChecklistOpcaoRespostaService()
  );
  container.register('checklistService', () => new ChecklistService());
  container.register('tipoChecklistService', () => new TipoChecklistService());
  container.register('tipoAtividadeService', () => new TipoAtividadeService());
  container.register(
    'checklistTipoVeiculoVinculoService',
    () => new ChecklistTipoVeiculoVinculoService()
  );
  container.register(
    'checklistTipoEquipeVinculoService',
    () => new ChecklistTipoEquipeVinculoService()
  );
  container.register(
    'checklistPendenciaService',
    () => new ChecklistPendenciaService()
  );
  container.register('userService', () => new UserService());
  container.register('mobileUserService', () => new MobileUserService());

  // Módulo de Escalas
  container.register('tipoEscalaService', () => new TipoEscalaService());
  container.register(
    'escalaEquipePeriodoService',
    () => new EscalaEquipePeriodoService()
  );
  container.register(
    'equipeHorarioVigenciaService',
    () => new EquipeHorarioVigenciaService()
  );
  container.register(
    'horarioAberturaCatalogoService',
    () => new HorarioAberturaCatalogoService()
  );
  container.register(
    'equipeTurnoHistoricoService',
    () => new EquipeTurnoHistoricoService()
  );
  container.register('turnoService', () => new TurnoService());

  // Justificativas
  container.register(
    'justificativaEquipeService',
    () => new JustificativaEquipeService()
  );
  container.register('justificativaService', () => new JustificativaService());
  container.register(
    'tipoJustificativaService',
    () => new TipoJustificativaService()
  );

  // Faltas e Horas Extras
  container.register('faltaService', () => new FaltaService());
  container.register('horaExtraService', () => new HoraExtraService());

  // Adicione novos serviços aqui conforme necessário
  // container.register('novoServico', () => new NovoServico());
}

/**
 * Executa o registro automaticamente
 *
 * Esta linha garante que os serviços sejam registrados
 * quando o módulo for importado.
 */
registerServices();

/**
 * Exporta o container para uso em outros módulos
 */
export { container };
