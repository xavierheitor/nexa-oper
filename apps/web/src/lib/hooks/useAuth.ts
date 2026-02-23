/**
 * Hook de Autenticação
 *
 * Hook customizado para verificar autenticação no cliente e validar
 * permissões e roles do usuário.
 *
 * FUNCIONALIDADES:
 * - Verifica status de autenticação
 * - Fornece dados da sessão (incluindo permissions e roles)
 * - Redireciona para login se não autenticado
 * - Valida permissões do usuário
 * - Valida roles do usuário
 * - Suporte a permissão requerida para acesso
 *
 * COMO USAR:
 * ```typescript
 * const { user, isAuthenticated, isLoading, hasPermission } = useAuth();
 *
 * if (!isAuthenticated) {
 *   return <div>Carregando...</div>;
 * }
 *
 * if (!hasPermission('dashboard:view')) {
 *   return <div>Acesso negado</div>;
 * }
 * ```
 *
 * COM PERMISSÃO REQUERIDA:
 * ```typescript
 * const { hasPermission } = useAuth({
 *   requiredPermission: 'apr:manage'
 * });
 * ```
 */

'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useCallback } from 'react';
import type { Permission, Role } from '@/lib/types/permissions';
import { redirectToLogin as redirectToLoginPage } from '@/lib/utils/redirectHandler';

interface UseAuthReturn {
  /** Dados do usuário da sessão */
  user: {
    id: string;
    username: string;
    email?: string;
    permissions: Permission[];
    roles: Role[];
  } | null;

  /** Se o usuário está autenticado */
  isAuthenticated: boolean;

  /** Se está carregando a sessão */
  isLoading: boolean;

  /** Função para verificar permissões */
  hasPermission: (permission: Permission) => boolean;

  /** Função para verificar roles */
  hasRole: (role: Role) => boolean;

  /** Função para fazer logout */
  logout: () => Promise<void>;
}

/**
 * Hook de autenticação com suporte a permissões
 *
 * @param options - Opções de configuração
 * @param options.redirectToLogin - Se deve redirecionar para login quando não autenticado (padrão: true)
 * @param options.requiredPermission - Permissão necessária para acessar (opcional)
 * @returns Dados de autenticação e funções auxiliares
 */
export function useAuth(options?: {
  redirectToLogin?: boolean;
  requiredPermission?: Permission;
}): UseAuthReturn {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { redirectToLogin = true, requiredPermission } = options || {};

  const isAuthenticated = !!session?.user;
  const isLoading = status === 'loading';

  // Redireciona para login se não autenticado
  useEffect(() => {
    if (
      !isLoading &&
      !isAuthenticated &&
      redirectToLogin &&
      typeof window !== 'undefined'
    ) {
      redirectToLoginPage();
    }
  }, [isAuthenticated, isLoading, redirectToLogin]);

  /**
   * Verifica se o usuário possui uma permissão específica
   *
   * @param permission - Permissão a ser verificada
   * @returns true se o usuário possui a permissão, false caso contrário
   */
  const hasPermission = useCallback(
    (permission: Permission): boolean => {
      if (!isAuthenticated || !session?.user) return false;

      // Obtém permissões da sessão
      const userPermissions = session.user.permissions || [];

      // Verifica se o usuário possui a permissão
      return userPermissions.includes(permission);
    },
    [isAuthenticated, session]
  );

  /**
   * Verifica se o usuário possui um role específico
   *
   * @param role - Role a ser verificado
   * @returns true se o usuário possui o role, false caso contrário
   */
  const hasRole = (role: Role): boolean => {
    if (!isAuthenticated || !session?.user) return false;

    // Obtém roles da sessão
    const userRoles = session.user.roles || [];

    // Verifica se o usuário possui o role
    return userRoles.includes(role);
  };

  // Verifica permissão requerida se especificada
  useEffect(() => {
    if (
      !isLoading &&
      isAuthenticated &&
      requiredPermission &&
      !hasPermission(requiredPermission)
    ) {
      // Redireciona para dashboard quando não tem permissão requerida
      // TODO: Criar página de acesso negado quando necessário
      router.push('/dashboard');
    }
  }, [isLoading, isAuthenticated, requiredPermission, hasPermission, router]);

  // Função de logout
  const logout = async () => {
    const { signOut } = await import('next-auth/react');
    await signOut({
      callbackUrl: '/login',
      redirect: true,
    });
  };

  return {
    user: session?.user
      ? {
          id: session.user.id,
          username: session.user.username,
          email: session.user.email,
          permissions: session.user.permissions || [],
          roles: session.user.roles || [],
        }
      : null,
    isAuthenticated,
    isLoading,
    hasPermission,
    hasRole,
    logout,
  };
}
