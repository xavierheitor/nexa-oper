/**
 * Service Container para Injeção de Dependência
 *
 * Este módulo implementa um container de serviços para injeção
 * de dependência, permitindo gerenciar instâncias de serviços
 * de forma centralizada e testável.
 *
 * FUNCIONALIDADES:
 * - Registro de serviços com factory functions
 * - Resolução de dependências
 * - Singleton pattern para instâncias
 * - Type safety com TypeScript
 * - Suporte a injeção de dependências
 *
 * COMO FUNCIONA:
 * 1. Registra serviços com factory functions
 * 2. Resolve dependências automaticamente
 * 3. Mantém instâncias singleton
 * 4. Fornece acesso centralizado aos serviços
 *
 * BENEFÍCIOS:
 * - Inversão de controle
 * - Facilita testes unitários
 * - Reduz acoplamento
 * - Centraliza criação de objetos
 * - Melhora manutenibilidade
 *
 * EXEMPLO DE USO:
 * ```typescript
 * // Registro de serviços
 * container.register('contratoService', () => new ContratoService());
 *
 * // Resolução de serviços
 * const contratoService = container.get<ContratoService>('contratoService');
 *
 * // Uso em actions
 * const service = container.get<ContratoService>('contratoService');
 * const result = await service.create(data, userId);
 * ```
 */

/**
 * Interface para factory functions
 */
type ServiceFactory<T> = () => T;

/**
 * Interface para o container de serviços
 */
interface IServiceContainer {
  register<T>(key: string, factory: ServiceFactory<T>): void;
  get<T>(key: string): T;
  has(key: string): boolean;
  clear(): void;
}

/**
 * Container de serviços para injeção de dependência
 *
 * Implementa o padrão Singleton e gerencia instâncias
 * de serviços de forma centralizada.
 */
export class ServiceContainer implements IServiceContainer {
  private static instance: ServiceContainer;
  private services = new Map<string, ServiceFactory<any>>();
  private instances = new Map<string, any>();

  /**
   * Construtor privado para implementar Singleton
   */
  private constructor() {}

  /**
   * Obtém a instância única do container
   *
   * @returns Instância única do ServiceContainer
   */
  static getInstance(): ServiceContainer {
    if (!this.instance) {
      this.instance = new ServiceContainer();
    }
    return this.instance;
  }

  /**
   * Registra um serviço no container
   *
   * @param key - Chave única para identificar o serviço
   * @param factory - Factory function para criar o serviço
   */
  register<T>(key: string, factory: ServiceFactory<T>): void {
    this.services.set(key, factory);
  }

  /**
   * Resolve um serviço do container
   *
   * @param key - Chave do serviço
   * @returns Instância do serviço
   * @throws Error se o serviço não for encontrado
   */
  get<T>(key: string): T {
    // Verifica se já existe uma instância
    if (this.instances.has(key)) {
      return this.instances.get(key);
    }

    // Busca a factory function
    const factory = this.services.get(key);
    if (!factory) {
      throw new Error(`Service '${key}' not found. Make sure it's registered.`);
    }

    // Cria a instância usando a factory
    const instance = factory();

    // Armazena a instância para reutilização (singleton)
    this.instances.set(key, instance);

    return instance;
  }

  /**
   * Verifica se um serviço está registrado
   *
   * @param key - Chave do serviço
   * @returns true se o serviço está registrado
   */
  has(key: string): boolean {
    return this.services.has(key);
  }

  /**
   * Limpa todos os serviços registrados
   * Útil para testes ou reinicialização
   */
  clear(): void {
    this.services.clear();
    this.instances.clear();
  }

  /**
   * Lista todas as chaves de serviços registrados
   *
   * @returns Array com as chaves dos serviços
   */
  getRegisteredServices(): string[] {
    return Array.from(this.services.keys());
  }
}

/**
 * Instância global do container de serviços
 *
 * Esta instância é compartilhada em toda a aplicação
 * e deve ser usada para registrar e resolver serviços.
 */
export const container = ServiceContainer.getInstance();

/**
 * Decorator para injeção de dependência (versão simplificada)
 *
 * NOTA: Esta é uma implementação básica do decorator Inject.
 * Para uso em produção com decorators avançados, considere instalar
 * e configurar a biblioteca 'reflect-metadata'.
 *
 * EXEMPLO DE USO FUTURO:
 * ```typescript
 * class ContratoController {
 *   constructor(@Inject('contratoService') private contratoService: ContratoService) {}
 * }
 * ```
 *
 * @param serviceKey - Chave do serviço a ser injetado
 * @returns Decorator function
 */
export function Inject(serviceKey: string) {
  return function (
    target: any,
    propertyKey: string | symbol | undefined,
    parameterIndex: number
  ) {
    // Implementação simplificada sem reflect-metadata
    // Armazena metadados básicos no target
    if (!target.__injectionTokens) {
      target.__injectionTokens = {};
    }
    target.__injectionTokens[parameterIndex] = serviceKey;

    console.log(
      `[ServiceContainer] 📝 Decorator @Inject('${serviceKey}') registrado para parâmetro ${parameterIndex}`
    );
  };
}
