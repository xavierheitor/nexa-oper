import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/utils/auth.config';

/**
 * Página inicial da aplicação
 *
 * Redireciona para /dashboard se autenticado ou /login se não autenticado
 */
export default async function Home() {
  const session = await getServerSession(authOptions);

  if (session) {
    redirect('/dashboard');
  } else {
    redirect('/login');
  }
}

