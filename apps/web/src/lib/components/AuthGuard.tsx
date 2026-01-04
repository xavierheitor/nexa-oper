/**
 * Componente de Proteção de Rotas (AuthGuard)
 *
 * Componente que protege rotas verificando autenticação e permissões
 * antes de renderizar o conteúdo.
 *
 * FUNCIONALIDADES:
 * - Verifica autenticação antes de renderizar
 * - Mostra loading enquanto verifica sessão
 * - Redireciona para login se não autenticado
 * - Valida permissões do usuário
 * - Mostra página de acesso negado se não tiver permissão
 * - Previne renderização de conteúdo com valores zerados
 *
 * COMO USAR:
 * ```typescript
 * // Proteção básica (apenas autenticação)
 * <AuthGuard>
 *   <MinhaPagina />
 * </AuthGuard>
 *
 * // Com permissão específica
 * <AuthGuard requiredPermission="dashboard:view">
 *   <MinhaPagina />
 * </AuthGuard>
 * ```
 */

'use client';

import { useAuth } from '@/lib/hooks/useAuth';
import type { Permission } from '@/lib/types/permissions';
import { Spin } from 'antd';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

interface AuthGuardProps {
  /** Conteúdo a ser renderizado se autenticado */
  children: React.ReactNode;

  /** Permissão necessária para acessar (opcional) */
  requiredPermission?: Permission;

  /** Se deve redirecionar para login quando não autenticado (padrão: true) */
  redirectToLogin?: boolean;

  /** Componente customizado de loading */
  loadingComponent?: React.ReactNode;
}

/**
 * Componente que protege rotas verificando autenticação
 *
 * @param props - Propriedades do componente
 * @returns Conteúdo renderizado ou loading/redirecionamento
 */
export default function AuthGuard({
  children,
  requiredPermission,
  redirectToLogin = true,
  loadingComponent,
}: AuthGuardProps) {
  const { isAuthenticated, isLoading, hasPermission } = useAuth({
    redirectToLogin,
    requiredPermission,
  });
  const router = useRouter();
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    // Aguarda um pouco para garantir que a sessão foi verificada
    if (!isLoading) {
      setIsChecking(false);
    }
  }, [isLoading]);

  // Mostra loading enquanto verifica autenticação
  if (isLoading || isChecking) {
    return (
      loadingComponent || (
        <div
          style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            minHeight: '100vh',
          }}
        >
          <Spin size="large" />
        </div>
      )
    );
  }

  // Se não autenticado e redirectToLogin está ativo, redireciona para login
  if (!isAuthenticated) {
    if (redirectToLogin && typeof window !== 'undefined') {
      // Usa window.location.href para forçar redirecionamento completo
      window.location.href = '/login';
    }
    return null;
  }

  // Verifica permissão se especificada
  if (requiredPermission && !hasPermission(requiredPermission)) {
    // TODO: Mostrar página de acesso negado quando implementado
    return (
      <div
        style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          minHeight: '100vh',
        }}
      >
        <div>
          <h2>Acesso Negado</h2>
          <p>Você não tem permissão para acessar esta página.</p>
        </div>
      </div>
    );
  }

  // Renderiza conteúdo se autenticado e com permissão (se necessário)
  return <>{children}</>;
}

