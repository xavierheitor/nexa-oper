/**
 * Configuração de Autenticação NextAuth.js
 *
 * Este arquivo define todas as configurações necessárias para o sistema de autenticação
 * da aplicação, incluindo provedores, adapters, sessões e callbacks.
 *
 * FUNCIONALIDADES:
 * - Autenticação por credenciais (username/password)
 * - Integração com Prisma para persistência de dados
 * - Gerenciamento de sessões JWT
 * - Criptografia de senhas com bcrypt
 * - Callbacks personalizados para JWT e sessão
 * - Páginas customizadas de login e erro
 *
 * COMO FUNCIONA:
 * 1. Usuário insere credenciais no formulário de login
 * 2. NextAuth chama a função authorize() com as credenciais
 * 3. Sistema busca usuário no banco de dados
 * 4. Compara senha com hash armazenado usando bcrypt
 * 5. Se válido, retorna dados do usuário
 * 6. NextAuth cria JWT com dados do usuário
 * 7. Sessão é mantida no cliente via cookies
 *
 * SEGURANÇA:
 * - Senhas são criptografadas com bcrypt
 * - JWT tokens são assinados com secret
 * - Sessões têm tempo de expiração configurado
 * - Validação de credenciais no servidor
 *
 * INTEGRAÇÃO:
 * - Prisma para acesso ao banco de dados
 * - NextAuth para gerenciamento de autenticação
 * - bcrypt para criptografia de senhas
 * - JWT para tokens de sessão
 */

// Importações necessárias para configuração do NextAuth
import bcrypt from 'bcrypt'; // Biblioteca para criptografia de senhas
import { type NextAuthOptions } from 'next-auth'; // Tipos do NextAuth
import CredentialsProvider from 'next-auth/providers/credentials'; // Provedor de credenciais
import { prisma } from '../db/db.service'; // Serviço de banco de dados
import {
  isPermission,
  resolveEffectivePermissions,
  type Permission,
  type Role,
} from '../types/permissions'; // Funções e tipos de permissões

type AuthorizationSnapshot = {
  roles: Role[];
  permissions: Permission[];
  permissionProfile: {
    id: number;
    key: string;
    nome: string;
  } | null;
};

function buildAuthorizationSnapshot(user: {
  UserPermissionGrant: Array<{ permission: string }>;
  permissionProfile: {
    id: number;
    key: string;
    nome: string;
    PermissionProfileGrant: Array<{ permission: string }>;
  } | null;
}): AuthorizationSnapshot {
  const roles: Role[] = [];
  const profilePermissions =
    user.permissionProfile?.PermissionProfileGrant.map((grant) => grant.permission)
      .filter(isPermission) ?? [];
  const directPermissions = user.UserPermissionGrant
    .map((grant) => grant.permission)
    .filter(isPermission);

  return {
    roles,
    permissions: resolveEffectivePermissions(
      roles,
      directPermissions,
      profilePermissions,
    ),
    permissionProfile: user.permissionProfile
      ? {
          id: user.permissionProfile.id,
          key: user.permissionProfile.key,
          nome: user.permissionProfile.nome,
        }
      : null,
  };
}

async function loadAuthorizationSnapshot(
  userId: number,
): Promise<AuthorizationSnapshot | null> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      UserPermissionGrant: {
        select: {
          permission: true,
        },
      },
      permissionProfile: {
        select: {
          id: true,
          key: true,
          nome: true,
          PermissionProfileGrant: {
            select: {
              permission: true,
            },
          },
        },
      },
    },
  });

  if (!user || user.deletedAt) {
    return null;
  }

  return buildAuthorizationSnapshot(user);
}

/**
 * Configuração principal do NextAuth
 *
 * Define todas as opções de autenticação, incluindo provedores,
 * adapters, sessões e callbacks personalizados.
 */
export const authOptions: NextAuthOptions = {
  // NOTA: Não usamos PrismaAdapter quando strategy é 'jwt'
  // O PrismaAdapter é usado apenas com strategy 'database'
  // Com JWT, as sessões são armazenadas em cookies, não no banco

  // Provedores de autenticação disponíveis
  providers: [
    // Provedor de credenciais (username/password)
    CredentialsProvider({
      name: 'credentials', // Nome do provedor
      credentials: {
        username: { label: 'Usuário', type: 'text' }, // Campo de usuário
        password: { label: 'Senha', type: 'password' }, // Campo de senha
      },

      /**
       * Função de autorização
       *
       * Esta função é chamada quando o usuário tenta fazer login.
       * Ela valida as credenciais fornecidas contra o banco de dados
       * e busca os roles e permissões do usuário.
       *
       * @param credentials - Credenciais fornecidas pelo usuário
       * @returns Dados do usuário com roles e permissões se válido, null se inválido
       */
      async authorize(credentials) {
        // Extrai username e password das credenciais
        const { username, password } = credentials as {
          username: string;
          password: string;
        };

        try {
          // Busca o usuário no banco de dados pelo username, incluindo seus roles
          const user = await prisma.user.findUnique({
            where: { username },
            include: {
              UserPermissionGrant: {
                select: {
                  permission: true,
                },
              },
              permissionProfile: {
                select: {
                  id: true,
                  key: true,
                  nome: true,
                  PermissionProfileGrant: {
                    select: {
                      permission: true,
                    },
                  },
                },
              },
            },
          });

          // Se usuário não encontrado, lança erro
          if (!user) throw new Error('Usuário não encontrado!');

          // Compara a senha fornecida com o hash armazenado no banco
          const isValid = await bcrypt.compare(password, user.password);

          // Se senha inválida, lança erro
          if (!isValid) throw new Error('Usuário ou senha inválidos!');

          const authorization = buildAuthorizationSnapshot(user);

          // Retorna dados do usuário para o NextAuth, incluindo roles e permissões
          return {
            id: user.id.toString(), // ID do usuário (convertido para string)
            username: user.username, // Nome de usuário
            email: user.email ?? '', // Email (com fallback para string vazia)
            permissions: authorization.permissions, // Lista de permissões efetivas
            roles: authorization.roles, // Lista de roles do usuário
            permissionProfile: authorization.permissionProfile,
          };
        } catch (error: any) {
          if (
            error.message === 'Usuário não encontrado!' ||
            error.message === 'Usuário ou senha inválidos!'
          ) {
            throw error;
          }
          console.error('Erro na autenticação (authorize):', error);
          throw new Error('Erro interno ao tentar autenticar. Verifique a conexão com o servidor.');
        }
      },
    }),
  ],

  // Configurações de sessão com sliding window
  session: {
    strategy: 'jwt', // Usa JWT para gerenciar sessões (mais eficiente)
    maxAge: 8 * 60 * 60, // Sessão expira em 8 horas de INATIVIDADE (28800 segundos)
    updateAge: 5 * 60, // Atualiza sessão a cada 5 minutos de ATIVIDADE (300 segundos)
  },

  // Callbacks personalizados para modificar JWT e sessão
  callbacks: {
    /**
     * Callback JWT - Implementa Sliding Session
     *
     * Executado sempre que um JWT é criado, atualizado ou acessado.
     * Implementa renovação automática da sessão baseada em atividade
     * e inclui roles e permissões no token.
     *
     * SLIDING SESSION:
     * - A cada requisição, verifica se passou o updateAge (5 min)
     * - Se sim, renova o token com novo tempo de expiração
     * - maxAge (8h) só conta a partir da ÚLTIMA atividade
     * - Inatividade de 8h = logout automático
     * - Atividade constante = sessão infinita
     *
     * PERMISSÕES E ROLES:
     * - Roles e permissões são incluídos no token no primeiro login
     * - Permissões são derivadas dos roles do usuário
     * - Token contém arrays de permissions e roles para validação rápida
     *
     * @param token - Token JWT atual
     * @param user - Dados do usuário (apenas no primeiro login)
     * @param trigger - Tipo de trigger (signin, update)
     * @returns Token JWT modificado com dados do usuário, roles e permissões
     */
    async jwt({ token, user, trigger }) {
      const now = Date.now();

      // Se é o primeiro login (user existe), adiciona dados ao token
      if (user) {
        token.id = user.id; // ID do usuário
        token.username = user.username; // Nome de usuário
        token.email = user.email; // Email do usuário
        token.permissions = user.permissions || []; // Permissões do usuário
        token.roles = user.roles || []; // Roles do usuário
        token.permissionProfile = user.permissionProfile || null;
        token.lastActivity = now; // Timestamp da última atividade
        token.permissionsRefreshedAt = now;
      }

      // Em toda requisição (trigger === 'update' ou undefined), atualiza lastActivity
      // Isso implementa a sliding session - renova a cada atividade
      if (trigger === 'update' || !trigger) {
        token.lastActivity = now;
      }

      if (
        token.id &&
        (!token.permissionsRefreshedAt ||
          now - token.permissionsRefreshedAt > 60_000)
      ) {
        const authorization = await loadAuthorizationSnapshot(Number(token.id));

        if (authorization) {
          token.permissions = authorization.permissions;
          token.roles = authorization.roles;
          token.permissionProfile = authorization.permissionProfile;
          token.permissionsRefreshedAt = now;
        }
      }

      return token;
    },

    /**
     * Callback de Sessão
     *
     * Executado sempre que uma sessão é verificada.
     * Permite adicionar dados personalizados à sessão do cliente,
     * incluindo roles e permissões.
     *
     * @param session - Sessão atual
     * @param token - Token JWT
     * @returns Sessão modificada com roles e permissões
     */
    async session({ session, token }) {
      // Se existe usuário na sessão, adiciona dados do token
      if (session.user) {
        session.user.id = token.id; // ID do usuário
        session.user.username = token.username; // Nome de usuário
        session.user.email = token.email; // Email do usuário
        session.user.permissions = token.permissions || []; // Permissões do usuário
        session.user.roles = token.roles || []; // Roles do usuário
        session.user.permissionProfile = token.permissionProfile || null;
      }
      return session;
    },
  },

  // Páginas customizadas
  pages: {
    signIn: '/login', // Página de login personalizada
    error: '/login', // Página de erro (redireciona para login)
  },

  // Secret para assinar JWT tokens (NEXTAUTH_SECRET ou AUTH_SECRET no .env.local)
  secret: process.env.NEXTAUTH_SECRET || process.env.AUTH_SECRET,

  // Habilite explicitamente com NEXTAUTH_DEBUG=true quando precisar investigar auth.
  debug:
    process.env.NODE_ENV === 'development' &&
    process.env.NEXTAUTH_DEBUG === 'true',
};
