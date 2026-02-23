/**
 * Configuração e factory do Pino.
 * Opções e transport configuráveis via env (LOG_LEVEL, LOG_PRETTY, LOG_TO_FILE, etc.).
 */
import pino, { LoggerOptions, TransportTargetOptions } from 'pino';

const env = process.env.NODE_ENV ?? 'development';
const isProd = env === 'production';

function envBool(name: string, def = false) {
  const v = (process.env[name] ?? '').toLowerCase();
  if (!v) return def;
  return ['1', 'true', 'yes', 'y', 'on'].includes(v);
}

function envStr(name: string, def: string) {
  return process.env[name] ?? def;
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
function envNum(name: string, def: number) {
  const v = Number(process.env[name]);
  return Number.isFinite(v) ? v : def;
}

export function buildPinoOptions(): LoggerOptions {
  const level = envStr('LOG_LEVEL', isProd ? 'info' : 'debug');

  return {
    level,
    base: isProd
      ? {
          env,
          service: envStr('SERVICE_NAME', 'nexa-api'),
          version: process.env.npm_package_version,
        }
      : undefined,

    // ISO automático (pino já sabe fazer isso)
    timestamp: pino.stdTimeFunctions.isoTime,
    messageKey: envStr('LOG_MESSAGE_KEY', 'message'),

    // Redact nativo (e configurável)
    redact: {
      paths: (
        process.env.LOG_REDACT_PATHS ??
        [
          'req.headers.authorization',
          'req.headers.cookie',
          'req.headers["set-cookie"]',
          'req.headers["x-api-key"]',
          'req.headers["x-auth-token"]',
          'req.headers["x-access-token"]',
          'req.headers["x-refresh-token"]',
          'req.body.password',
          'req.body.senha',
          'req.body.token',
          'req.body.accessToken',
          'req.body.refreshToken',
          'req.body.jwt',
          'req.body.secret',
          'req.body.apiKey',
          'req.body.apikey',
          'req.body.authorization',
        ].join(',')
      ) // permite override via .env
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean),

      censor: envStr('LOG_REDACT_CENSOR', '****'),
      remove: envBool('LOG_REDACT_REMOVE', false),
    },
  };
}

/**
 * Transport:
 * - dev: pino-pretty (se LOG_PRETTY=true ou default)
 * - prod: por padrão NÃO usa pino/file (PM2 cuida), mas você pode habilitar via LOG_TO_FILE=true
 */
export function buildPinoTransport():
  | { targets: TransportTargetOptions[] }
  | undefined {
  const pretty = envBool('LOG_PRETTY', !isProd) && !isProd; // pretty só faz sentido no dev

  if (pretty) {
    return {
      targets: [
        {
          target: 'pino-pretty',
          level: envStr('LOG_PRETTY_LEVEL', 'debug'),
          options: {
            colorize: envBool('LOG_PRETTY_COLOR', true),
            levelFirst: envBool('LOG_PRETTY_LEVEL_FIRST', true),
            translateTime: envStr('LOG_PRETTY_TIME', 'SYS:yyyy-mm-dd HH:MM:ss'),
            ignore: envStr(
              'LOG_PRETTY_IGNORE',
              'pid,hostname,env,service,version',
            ),
          },
        },
      ],
    };
  }

  // Em produção, default = stdout (PM2)
  // Só grava em arquivo se você explicitamente quiser.
  const toFile = envBool('LOG_TO_FILE', false);
  if (!toFile) return undefined;

  const logDir = envStr('LOG_PATH', './logs');
  const appLogPath = envStr('LOG_APP_FILE', `${logDir}/app.log`);
  const errLogPath = envStr('LOG_ERROR_FILE', `${logDir}/error.log`);

  return {
    targets: [
      {
        target: 'pino/file',
        level: envStr('LOG_FILE_LEVEL', 'info'),
        options: { destination: appLogPath, mkdir: true, sync: false },
      },
      {
        target: 'pino/file',
        level: envStr('LOG_ERROR_LEVEL', 'error'),
        options: { destination: errLogPath, mkdir: true, sync: false },
      },
    ],
  };
}

export function createPinoLogger() {
  const options = buildPinoOptions();
  const transport = buildPinoTransport();
  return transport ? pino({ ...options, transport }) : pino(options);
}
