import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  /* config options here */
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
