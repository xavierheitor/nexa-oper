/**
 * Middleware de Autenticação do Next.js
 *
 * Este middleware protege todas as rotas /dashboard, garantindo que apenas
 * usuários autenticados possam acessá-las. Redireciona automaticamente
 * para /login se não houver sessão válida.
 *
 * FUNCIONALIDADES:
 * - Proteção automática de rotas /dashboard
 * - Redirecionamento para login quando não autenticado
 * - Verificação de sessão em cada requisição
 * - Preparado para sistema de permissões futuro
 *
 * COMO FUNCIONA:
 * 1. Intercepta todas as requisições para /dashboard/*
 * 2. Verifica se há sessão válida usando getToken do NextAuth
 * 3. Se não houver sessão, redireciona para /login
 * 4. Se houver sessão, permite o acesso
 *
 * FUTURO:
 * - Adicionar verificação de permissões por rota
 * - Adicionar verificação de roles do usuário
 * - Adicionar logging de tentativas de acesso não autorizado
 */

import { withAuth } from 'next-auth/middleware';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export default withAuth(
  function middleware(_req: NextRequest & { nextauth?: { token?: any } }) {
    // Aqui podemos adicionar verificações de permissões no futuro
    // Por enquanto, apenas verifica autenticação
    // TODO: adicionar verificação de permissões por rota quando disponível

    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token }) => {
        // Verifica se há token (usuário autenticado)
        return !!token;
      },
    },
    pages: {
      signIn: '/login', // Página de login customizada
    },
  }
);

// Configura quais rotas devem ser protegidas
export const config = {
  matcher: [
    '/dashboard/:path*', // Protege todas as rotas /dashboard/*
  ],
};
