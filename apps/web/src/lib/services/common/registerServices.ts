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

import { ContratoService } from '../ContratoService';
import { EletricistaService } from '../EletricistaService';
import { MobileUserService } from '../MobileUserService';
import { EquipeService } from '../EquipeService';
import { TipoEquipeService } from '../TipoEquipeService';
import { SupervisorService } from '../SupervisorService';
import { TipoVeiculoService } from '../TipoVeiculoService';
import { ChecklistService } from '../ChecklistService';
import { ChecklistPerguntaService } from '../ChecklistPerguntaService';
import { ChecklistOpcaoRespostaService } from '../ChecklistOpcaoRespostaService';
import { EquipeSupervisorService } from '../EquipeSupervisorService';
import { UserService } from '../UserService';
import { VeiculoService } from '../VeiculoService';
import { container } from './ServiceContainer';
import { TipoChecklistService } from '../TipoChecklistService';

/**
 * Registra todos os serviços no container
 *
 * Esta função deve ser chamada na inicialização da aplicação
 * para configurar todos os serviços e suas dependências.
 */
export function registerServices(): void {
  // Registra serviços de domínio
  container.register('contratoService', () => new ContratoService());
  container.register('tipoEquipeService', () => new TipoEquipeService());
  container.register('equipeService', () => new EquipeService());
  container.register('tipoVeiculoService', () => new TipoVeiculoService());
  container.register('veiculoService', () => new VeiculoService());
  container.register('eletricistaService', () => new EletricistaService());
  container.register('supervisorService', () => new SupervisorService());
  container.register('equipeSupervisorService', () => new EquipeSupervisorService());
  container.register('checklistPerguntaService', () => new ChecklistPerguntaService());
  container.register('checklistOpcaoRespostaService', () => new ChecklistOpcaoRespostaService());
  container.register('checklistService', () => new ChecklistService());
  container.register('tipoChecklistService', () => new TipoChecklistService());
  container.register('userService', () => new UserService());
  container.register('mobileUserService', () => new MobileUserService());

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
