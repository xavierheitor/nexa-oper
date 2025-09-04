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
