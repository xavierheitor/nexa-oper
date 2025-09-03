/**
 * Hook personalizado para detectar quando o componente foi hidratado no cliente
 *
 * Este hook é essencial para resolver problemas de hidratação no Next.js, especialmente
 * quando usamos bibliotecas que dependem do DOM ou do objeto `window` (como Ant Design,
 * bibliotecas de data, etc.).
 *
 * PROBLEMA QUE RESOLVE:
 * - Durante o Server-Side Rendering (SSR), o Next.js renderiza o HTML no servidor
 * - Quando o JavaScript carrega no cliente, o React "hidrata" o HTML existente
 * - Se houver diferenças entre o que foi renderizado no servidor vs cliente, ocorre erro de hidratação
 * - Bibliotecas como Ant Design podem renderizar diferentemente no servidor vs cliente
 *
 * COMO FUNCIONA:
 * 1. Inicialmente retorna `false` (componente ainda não foi hidratado)
 * 2. Após o primeiro render no cliente, `useEffect` executa e define `hydrated = true`
 * 3. Componentes podem usar este valor para renderizar condicionalmente
 *
 * EXEMPLO DE USO:
 * ```tsx
 * function MyComponent() {
 *   const hydrated = useHydrated();
 *
 *   // Renderiza loading no servidor, conteúdo real no cliente
 *   if (!hydrated) {
 *     return <div>Carregando...</div>;
 *   }
 *
 *   // Agora é seguro usar bibliotecas que dependem do DOM
 *   return <AntdComponent />;
 * }
 * ```
 *
 * BENEFÍCIOS:
 * - Evita erros de hidratação
 * - Melhora a experiência do usuário
 * - Permite uso seguro de bibliotecas client-side
 * - Mantém consistência entre servidor e cliente
 *
 * @returns {boolean} true quando o componente foi hidratado no cliente, false caso contrário
 */
import { useEffect, useState } from 'react';

export function useHydrated() {
  // Estado que controla se o componente já foi hidratado
  // Inicia como false (ainda não hidratado)
  const [hydrated, setHydrated] = useState(false);

  // useEffect executa apenas no cliente, após a hidratação
  // Array de dependências vazio garante que execute apenas uma vez
  useEffect(() => {
    // Marca o componente como hidratado
    setHydrated(true);
  }, []);

  // Retorna o estado de hidratação
  return hydrated;
}
