'use client';

import { useEffect } from 'react';
import { captureUnexpected } from '@/lib/utils/monitoring';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Server render failures have already been captured by onRequestError.
    if (!error.digest) captureUnexpected(error);
  }, [error]);
  return (
    <html lang='pt-BR'>
      <body>
        <h1>Ocorreu um erro ao carregar a página.</h1>
        <button onClick={reset}>Tentar novamente</button>
      </body>
    </html>
  );
}
