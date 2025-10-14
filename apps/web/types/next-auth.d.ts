/**
 * Extensões de Tipos para NextAuth.js
 *
 * Este arquivo estende os tipos padrão do NextAuth.js para incluir
 * campos personalizados específicos da nossa aplicação, garantindo
 * type safety completo em toda a aplicação.
 *
 * FUNCIONALIDADES:
 * - Estende interface User com campos personalizados
 * - Estende interface Session com dados do usuário
 * - Estende interface JWT com informações de autenticação
 * - Garante type safety em toda a aplicação
 * - Permite acesso tipado aos dados de sessão
 *
 * COMO FUNCIONA:
 * 1. Importa tipos base do NextAuth
 * 2. Estende interfaces com campos personalizados
 * 3. TypeScript reconhece automaticamente as extensões
 * 4. Aplicação ganha type safety completo
 *
 * BENEFÍCIOS:
 * - IntelliSense completo para dados de sessão
 * - Prevenção de erros de tipo em tempo de compilação
 * - Documentação automática dos campos disponíveis
 * - Refatoração segura de código
 * - Melhor experiência de desenvolvimento
 *
 * EXEMPLO DE USO:
 * ```typescript
 * import { useSession } from 'next-auth/react';
 *
 * function MyComponent() {
 *   const { data: session } = useSession();
 *
 *   // TypeScript sabe que session.user.username existe
 *   return <div>Olá, {session?.user?.username}!</div>;
 * }
 * ```
 */

// Importação dos tipos base do NextAuth para extensão
import 'next-auth';

/**
 * Extensão do módulo 'next-auth' para adicionar campos personalizados
 *
 * Esta declaração de módulo estende as interfaces padrão do NextAuth
 * com campos específicos da nossa aplicação, mantendo compatibilidade
 * com a biblioteca original.
 */
declare module 'next-auth' {
  /**
   * Interface User - Dados do usuário autenticado
   *
   * Estende a interface padrão do NextAuth com campos personalizados
   * que são específicos da nossa aplicação.
   *
   * CAMPOS PERSONALIZADOS:
   * - id: Identificador único do usuário (string)
   * - username: Nome de usuário para login (string)
   * - email: Email do usuário (string)
   *
   * NOTA: Estes campos devem corresponder aos dados retornados
   * pela função authorize() no auth.config.ts
   */
  interface User {
    id: string; // ID único do usuário
    username: string; // Nome de usuário para autenticação
    email: string; // Email do usuário
  }

  /**
   * Interface Session - Dados da sessão do usuário
   *
   * Define a estrutura dos dados de sessão que ficam disponíveis
   * em toda a aplicação através do useSession() hook.
   *
   * CAMPOS DISPONÍVEIS:
   * - user.id: ID do usuário logado
   * - user.username: Nome de usuário
   * - user.email: Email (opcional)
   *
   * USO: Acessível via useSession() em qualquer componente
   */
  interface Session {
    user: {
      id: string; // ID do usuário logado
      username: string; // Nome de usuário
      email?: string; // Email (opcional)
    };
  }

  /**
   * Interface JWT - Dados do token JWT
   *
   * Define quais dados são armazenados no token JWT que é
   * enviado entre cliente e servidor para manter a sessão.
   *
   * CAMPOS DO TOKEN:
   * - id: ID do usuário
   * - username: Nome de usuário
   * - email: Email (opcional)
   * - lastActivity: Timestamp da última atividade (para sliding session)
   *
   * NOTA: Estes dados são definidos no callback JWT do auth.config.ts
   */
  interface JWT {
    id: string; // ID do usuário no token
    username: string; // Nome de usuário no token
    email?: string; // Email no token (opcional)
    lastActivity?: number; // Timestamp da última atividade (sliding session)
  }
}

/**
 * Extensão do módulo 'next-auth/jwt' para JWT específico
 *
 * Esta declaração estende especificamente os tipos JWT do NextAuth,
 * garantindo que os campos personalizados estejam disponíveis
 * em contextos específicos de JWT.
 */
declare module 'next-auth/jwt' {
  /**
   * Interface JWT - Dados do token JWT (versão específica)
   *
   * Versão específica da interface JWT para contextos onde
   * o NextAuth/JWT é usado diretamente.
   *
   * CAMPOS OBRIGATÓRIOS:
   * - id: ID do usuário
   * - username: Nome de usuário
   * - email: Email (obrigatório nesta versão)
   * - lastActivity: Timestamp da última atividade
   *
   * DIFERENÇA: Nesta versão, email é obrigatório, não opcional
   */
  interface JWT {
    id: string; // ID do usuário
    username: string; // Nome de usuário
    email: string; // Email (obrigatório)
    lastActivity?: number; // Timestamp da última atividade (sliding session)
  }
}
