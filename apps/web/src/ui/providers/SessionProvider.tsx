/**
 * Provider de Sessão NextAuth
 *
 * Componente wrapper que fornece contexto de autenticação NextAuth
 * para toda a aplicação.
 *
 * FUNCIONALIDADES:
 * - Fornece contexto de sessão para hooks useSession()
 * - Permite renovação automática de sessão
 * - Gerencia estado de autenticação global
 *
 * USO:
 * - Adicionar no layout raiz da aplicação
 * - Envolver todos os componentes que usam autenticação
 */

'use client';

import { SessionProvider as NextAuthSessionProvider } from 'next-auth/react';
import { ReactNode } from 'react';

interface SessionProviderProps {
  children: ReactNode;
}

export default function SessionProvider({ children }: SessionProviderProps) {
  return (
    <NextAuthSessionProvider
      // Revalida sessão ao focar na aba
      refetchOnWindowFocus={true}
      // Intervalo de revalidação em segundos (5 minutos)
      refetchInterval={5 * 60}
    >
      {children}
    </NextAuthSessionProvider>
  );
}

