/**
 * Serviço de Banco de Dados com Singleton Pattern
 *
 * Este serviço fornece acesso centralizado ao Prisma Client na aplicação Next.js,
 * implementando o padrão Singleton para garantir uma única instância da conexão
 * com o banco de dados em toda a aplicação.
 *
 * FUNCIONALIDADES:
 * - Singleton pattern para instância única do Prisma
 * - Gerenciamento automático de conexão/desconexão
 * - Reutilização de conexão em desenvolvimento (Hot Reload)
 * - Health check para monitoramento
 * - Logging configurável por ambiente
 * - Prevenção de múltiplas conexões desnecessárias
 *
 * COMO FUNCIONA:
 * 1. Cria uma única instância do Prisma Client
 * 2. Reutiliza a conexão em desenvolvimento (global.prisma)
 * 3. Fornece métodos para health check e desconexão
 * 4. Exporta instâncias prontas para uso
 *
 * BENEFÍCIOS:
 * - Evita múltiplas conexões com o banco
 * - Melhora performance em desenvolvimento
 * - Facilita gerenciamento de conexões
 * - Previne vazamentos de memória
 * - Centraliza configuração do Prisma
 *
 * EXEMPLO DE USO:
 * ```typescript
 * // Importação direta do Prisma Client
 * import { prisma } from '@/lib/db/db.service';
 *
 * // Uso em Server Actions
 * const users = await prisma.user.findMany();
 *
 * // Uso em API Routes
 * const user = await prisma.user.create({ data: userData });
 * ```
 */

// Importação do Prisma Client do pacote compartilhado
import { PrismaClient } from '@nexa-oper/db';

/**
 * Declaração global para reutilização de conexão em desenvolvimento
 *
 * Em desenvolvimento, o Next.js faz Hot Reload que pode criar múltiplas
 * instâncias do Prisma. Esta declaração global permite reutilizar a mesma
 * conexão, evitando problemas de "too many connections".
 */
declare global {
  var prisma: PrismaClient | undefined;
}

/**
 * Classe DbService - Implementa Singleton Pattern para Prisma Client
 *
 * Garante que apenas uma instância do Prisma Client seja criada
 * em toda a aplicação, otimizando recursos e evitando problemas
 * de conexão com o banco de dados.
 */
class DbService {
  // Instância única da classe (Singleton)
  private static instance: DbService;

  // Instância do Prisma Client
  private prisma: PrismaClient;

  /**
   * Construtor privado - Impede criação direta de instâncias
   *
   * Aplica o padrão Singleton, garantindo que apenas uma instância
   * seja criada através do método getInstance().
   */
  private constructor() {
    // Reutiliza conexão existente ou cria nova
    this.prisma =
      global.prisma ||
      new PrismaClient({
        // Configuração de logging baseada no ambiente
        log:
          process.env.NODE_ENV === 'development'
            ? ['query', 'error', 'warn'] // Desenvolvimento: logs detalhados
            : ['error'], // Produção: apenas erros
        // Timeout aumentado para transações complexas
        transactionOptions: {
          maxWait: 10000, // Espera máxima para adquirir uma transação (10s)
          timeout: 30000, // Timeout da transação (30s)
        },
      });

    // Em desenvolvimento, armazena no global para reutilização
    if (process.env.NODE_ENV !== 'production') {
      global.prisma = this.prisma;
    }
  }

  /**
   * Método estático para obter a instância única (Singleton)
   *
   * @returns Instância única do DbService
   */
  public static getInstance(): DbService {
    if (!DbService.instance) {
      DbService.instance = new DbService();
    }
    return DbService.instance;
  }

  /**
   * Retorna a instância do Prisma Client
   *
   * @returns Instância do Prisma Client para operações no banco
   */
  public getPrisma(): PrismaClient {
    return this.prisma;
  }

  /**
   * Verifica a saúde da conexão com o banco de dados
   *
   * Executa uma query simples para verificar se a conexão
   * está funcionando corretamente.
   *
   * @returns Promise<boolean> - true se conexão está OK, false caso contrário
   */
  public async healthCheck(): Promise<boolean> {
    try {
      // Query simples para testar conexão
      await this.prisma.$queryRaw`SELECT 1`;
      return true;
    } catch (error) {
      console.error('❌ Health check falhou:', error);
      return false;
    }
  }

  /**
   * Desconecta do banco de dados e limpa recursos
   *
   * Fecha a conexão com o banco e limpa as instâncias
   * para liberar recursos da memória.
   */
  public async disconnect(): Promise<void> {
    try {
      // Desconecta do banco
      await this.prisma.$disconnect();

      // Em desenvolvimento, limpa a referência global
      if (process.env.NODE_ENV !== 'production') {
        global.prisma = undefined;
      }

      // Limpa a instância singleton
      DbService.instance = undefined as any;
    } catch (error) {
      console.error('❌ Erro ao desconectar:', error);
    }
  }
}

/**
 * Instância única do DbService para uso em toda a aplicação
 *
 * Esta exportação garante que sempre usemos a mesma instância
 * do serviço de banco de dados.
 */
export const dbService = DbService.getInstance();

/**
 * Instância direta do Prisma Client para uso simplificado
 *
 * Esta exportação permite usar o Prisma Client diretamente
 * sem precisar chamar dbService.getPrisma() toda vez.
 *
 * EXEMPLO DE USO:
 * ```typescript
 * import { prisma } from '@/lib/db/db.service';
 *
 * // Uso direto do Prisma Client
 * const users = await prisma.user.findMany();
 * const newUser = await prisma.user.create({ data: userData });
 * ```
 */
export const prisma = dbService.getPrisma();
