/** PM2 ecosystem for Nexa Oper (API + Web) */
const path = require('path');
const fs = require('fs');

// Ajuste só estes dois valores no deploy.
const MONOREPO_ROOT =
  process.env.MONOREPO_ROOT || '/var/www/apps/nexa-oper';
const MONOREPO_BASE_URL =
  process.env.MONOREPO_BASE_URL || 'https://nexa.xsys.team';

function stripTrailingSlash(value) {
  return String(value || '').trim().replace(/\/+$/g, '');
}

function deriveSiblingUrl(baseUrl, subdomainPrefix) {
  const url = new URL(stripTrailingSlash(baseUrl));
  url.hostname = `${subdomainPrefix}.${url.hostname}`;
  return stripTrailingSlash(url.toString());
}

const WEB_BASE_URL = stripTrailingSlash(MONOREPO_BASE_URL);
const API_BASE_URL = deriveSiblingUrl(WEB_BASE_URL, 'api');
const API_UPLOADS_BASE_URL = `${API_BASE_URL}/uploads`;
const PHOTOS_BASE_URL = stripTrailingSlash(
  process.env.MONOREPO_PHOTOS_BASE_URL || API_UPLOADS_BASE_URL,
);
const LOG_DIR = path.join(MONOREPO_ROOT, 'logs');
const API_ENV_PATH = path.join(MONOREPO_ROOT, 'apps/api/.env');
const WEB_ENV_PATH = path.join(MONOREPO_ROOT, 'apps/web/.env.local');
const API_DIST_PATH = path.join(MONOREPO_ROOT, 'apps/api/dist/main.js');
const WEB_NEXT_BIN = path.join(MONOREPO_ROOT, 'node_modules/.bin/next');

// Função para carregar variáveis de ambiente de um arquivo .env
function loadEnvFile(filePath) {
  const env = {};
  if (fs.existsSync(filePath)) {
    const content = fs.readFileSync(filePath, 'utf8');
    content.split('\n').forEach((line) => {
      const trimmedLine = line.trim();
      if (trimmedLine && !trimmedLine.startsWith('#')) {
        const [key, ...valueParts] = trimmedLine.split('=');
        if (key && valueParts.length > 0) {
          // Remove aspas do início e fim se existirem
          let value = valueParts.join('=');
          if ((value.startsWith('"') && value.endsWith('"')) ||
              (value.startsWith("'") && value.endsWith("'"))) {
            value = value.slice(1, -1);
          }
          env[key.trim()] = value.trim();
        }
      }
    });
  }
  return env;
}

// Carregar variáveis de ambiente dos arquivos .env
const apiEnv = loadEnvFile(API_ENV_PATH);
const webEnv = loadEnvFile(WEB_ENV_PATH);

module.exports = {
  apps: [
    // ===================== API =====================
    {
      name: 'nexa-api',
      cwd: MONOREPO_ROOT,
      script: API_DIST_PATH,
      exec_mode: 'cluster',
      instances: 2,
      // Interpreter & Node flags
      interpreter: 'node',
      node_args: ['--unhandled-rejections=strict', '--trace-warnings'],
      // Health & lifecycle
      listen_timeout: 10000,
      kill_timeout: 30000,
      wait_ready: false,
      shutdown_with_message: false,
      // Restart policy
      autorestart: true,
      min_uptime: '10s',
      max_restarts: 10,
      restart_delay: 4000,
      exp_backoff_restart_delay: 2000,
      max_memory_restart: '1G',
      // Env - mesclar variáveis do .env com as padrões
      env: {
        ...apiEnv,
        NODE_ENV: 'production',
        PORT: 3001,
        LOG_PATH: LOG_DIR,
        TRUST_PROXY: 'true',
        HAS_HTTPS: 'false',
        NEXT_PUBLIC_API_URL: API_BASE_URL,
        UPLOAD_PROXY_TARGET: API_BASE_URL,
        UPLOAD_BASE_URL: API_UPLOADS_BASE_URL,
        ENV_FILE_PATH: API_ENV_PATH,
      },
      // Logs
      merge_logs: true,
      time: true,
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      out_file: path.join(LOG_DIR, 'api-out.log'),
      error_file: path.join(LOG_DIR, 'api-error.log'),
    },

    // ===================== WEB (Next.js) =====================
    {
      name: 'nexa-web',
      cwd: path.join(MONOREPO_ROOT, 'apps/web'),
      script: WEB_NEXT_BIN,
      args: 'start -p 3000',
      exec_mode: 'cluster',
      instances: 2,
      interpreter: 'node',
      node_args: ['--trace-warnings'],
      listen_timeout: 15000,
      kill_timeout: 30000,
      wait_ready: false,
      shutdown_with_message: false,
      autorestart: true,
      min_uptime: '10s',
      max_restarts: 10,
      restart_delay: 4000,
      exp_backoff_restart_delay: 2000,
      max_memory_restart: '1G',
      // Env - mesclar variáveis do .env com as padrões
      env: {
        ...webEnv,
        NODE_ENV: 'production',
        PORT: 3000,
        LOG_PATH: LOG_DIR,
        NEXTAUTH_URL: WEB_BASE_URL,
        NEXT_PUBLIC_API_URL: API_BASE_URL,
        UPLOAD_PROXY_TARGET: API_BASE_URL,
        NEXT_PUBLIC_UPLOAD_BASE_URL: PHOTOS_BASE_URL,
        NEXT_PUBLIC_PHOTOS_BASE_URL: PHOTOS_BASE_URL,
      },
      merge_logs: true,
      time: true,
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      out_file: path.join(LOG_DIR, 'web-out.log'),
      error_file: path.join(LOG_DIR, 'web-error.log'),
    },
  ],
};
