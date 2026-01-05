import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  /* config options here */
  // Configuração ESLint - permite que o build continue mesmo com warnings
  eslint: {
    // Ignora erros do ESLint durante o build (warnings já são ignorados por padrão)
    // Apenas erros TypeScript críticos ainda fazem o build falhar
    ignoreDuringBuilds: true,
  },
  // Configuração para servir arquivos estáticos de uploads
  async rewrites() {
    return [
      {
        source: '/uploads/justificativas/anexos/:path*',
        destination: '/api/uploads/justificativas/anexos/:path*',
      },
    ];
  },
};

export default nextConfig;
