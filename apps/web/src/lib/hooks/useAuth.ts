/**
 * Hook de Autenticação
 *
 * Hook customizado para verificar autenticação no cliente e preparar
 * para sistema de permissões futuro.
 *
 * FUNCIONALIDADES:
 * - Verifica status de autenticação
 * - Fornece dados da sessão
 * - Redireciona para login se não autenticado
 * - Preparado para verificação de permissões
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
 */

'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

/**
 * Tipos para permissões (preparado para futuro)
 */
export type Permission = string; // Ex: 'dashboard:view', 'users:create', etc.
export type Role = string; // Ex: 'admin', 'manager', 'user', etc.

interface UseAuthReturn {
  /** Dados do usuário da sessão */
  user: {
    id: string;
    username: string;
    email?: string;
  } | null;

  /** Se o usuário está autenticado */
  isAuthenticated: boolean;

  /** Se está carregando a sessão */
  isLoading: boolean;

  /** Função para verificar permissões (preparado para futuro) */
  hasPermission: (permission: Permission) => boolean;

  /** Função para verificar roles (preparado para futuro) */
  hasRole: (role: Role) => boolean;

  /** Função para fazer logout */
  logout: () => Promise<void>;
}

/**
 * Hook de autenticação com suporte a permissões
 *
 * @param options - Opções de configuração
 * @param options.redirectToLogin - Se deve redirecionar para login quando não autenticado (padrão: true)
 * @param options.requiredPermission - Permissão necessária para acessar (opcional, para futuro)
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
    if (!isLoading && !isAuthenticated && redirectToLogin && typeof window !== 'undefined') {
      // Usa window.location.href para forçar redirecionamento completo
      // Isso garante que a página seja completamente recarregada e não mostre conteúdo zerado
      window.location.href = '/login';
    }
  }, [isAuthenticated, isLoading, redirectToLogin]);

  // Verifica permissões (preparado para futuro)
  // Por enquanto, sempre retorna true se autenticado
  const hasPermission = (permission: Permission): boolean => {
    if (!isAuthenticated) return false;

    // TODO: Implementar verificação de permissões quando o sistema estiver pronto
    // Por enquanto, todos os usuários autenticados têm todas as permissões

    return true; // Temporário: permite tudo se autenticado
  };

  // Verifica roles (preparado para futuro)
  const hasRole = (role: Role): boolean => {
    if (!isAuthenticated) return false;

    // TODO: Implementar verificação de roles quando o sistema estiver pronto

    return true; // Temporário: permite tudo se autenticado
  };

  // Verifica permissão requerida se especificada
  useEffect(() => {
    if (
      !isLoading &&
      isAuthenticated &&
      requiredPermission &&
      !hasPermission(requiredPermission)
    ) {
      // TODO: Redirecionar para página de acesso negado quando implementado
      router.push('/dashboard');
    }
  }, [isLoading, isAuthenticated, requiredPermission, router]);

  // Função de logout
  const logout = async () => {
    const { signOut } = await import('next-auth/react');
    await signOut({
      callbackUrl: '/login',
      redirect: true
    });
  };

  return {
    user: session?.user
      ? {
          id: session.user.id,
          username: session.user.username,
          email: session.user.email,
        }
      : null,
    isAuthenticated,
    isLoading,
    hasPermission,
    hasRole,
    logout,
  };
}
