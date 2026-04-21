// src/core/config/env.ts
import { z } from 'zod';

const bool = z
  .string()
  .optional()
  .transform((v) =>
    ['1', 'true', 'yes', 'y', 'on'].includes((v ?? '').toLowerCase()),
  );

const csvOrJsonArray = z
  .string()
  .optional()
  .transform((v) => {
    if (!v) {
      return [];
    }
    const trimmed = v.trim();
    if (!trimmed) {
      return [];
    }

    // JSON array: ["https://a.com","https://b.com"]
    if (trimmed.startsWith('[')) {
      try {
        const arr: unknown = JSON.parse(trimmed);
        if (Array.isArray(arr)) {
          return arr.map(String);
        }
      } catch {
        // cai pro CSV
      }
    }

    // CSV: https://a.com,https://b.com
    return trimmed
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);
  });

const trimmedOptional = z
  .string()
  .optional()
  .transform((v) => {
    const trimmed = v?.trim();
    return trimmed && trimmed.length > 0 ? trimmed : undefined;
  });

export const envSchema = z.object({
  NODE_ENV: z
    .enum(['development', 'production', 'test'])
    .default('development'),
  PORT: z.coerce.number().default(3000),

  /** Timezone IANA (ex.: America/Sao_Paulo, UTC). Afeta Date, Prisma, logs. */
  TZ: z.string().default('America/Sao_Paulo'),

  DATABASE_URL: z.string().min(1),
  DATABASE_TIME_ZONE: z.string().optional(),
  JWT_SECRET: z.string().min(32),

  TRUST_PROXY: bool.default(false),
  HAS_HTTPS: bool.default(false),

  GLOBAL_PREFIX: z.string().default('api'),

  REQUEST_TIMEOUT_MS: z.coerce.number().default(60_000),
  JSON_LIMIT: z.string().default('2mb'),
  ATIVIDADE_UPLOAD_JSON_LIMIT: z.string().default('12mb'),
  URLENCODED_LIMIT: z.string().default('2mb'),

  // CORS (CSV ou JSON array)
  CORS_ORIGINS: csvOrJsonArray,

  // Swagger
  SWAGGER_ENABLED: bool.default(true),

  // Helmet/security
  SECURITY_CSP: bool.default(false), // pra não quebrar swagger
  SECURITY_COEP: bool.default(false),

  // Rate limit (se você usar)
  RATE_LIMIT_WINDOW_MS: z.coerce.number().default(60_000),
  RATE_LIMIT_MAX_PER_IP: z.coerce.number().default(20),
  RATE_LIMIT_MAX_PER_USER: z.coerce.number().default(5),

  // Bloqueio opcional por versão mínima do app mobile
  MOBILE_MIN_VERSION_ANDROID: trimmedOptional,
  MOBILE_MIN_VERSION_ANDROID_LOGIN: trimmedOptional,
  MOBILE_MIN_VERSION_ANDROID_OPEN_TURNO: trimmedOptional,
  MOBILE_MIN_VERSION_IOS: trimmedOptional,
  MOBILE_MIN_VERSION_IOS_LOGIN: trimmedOptional,
  MOBILE_MIN_VERSION_IOS_OPEN_TURNO: trimmedOptional,

  // Upload storage: local | s3
  UPLOAD_STORAGE: z.enum(['local', 's3']).default('local'),
  UPLOAD_ROOT: z
    .string()
    .optional()
    .transform((v) => {
      const trimmed = v?.trim();
      return trimmed && trimmed.length > 0 ? trimmed : undefined;
    }),
  UPLOAD_LEGACY_ROOTS: csvOrJsonArray,
  UPLOAD_BASE_URL: z
    .string()
    .optional()
    .transform((v) => {
      const trimmed = v?.trim();
      return trimmed && trimmed.length > 0 ? trimmed : undefined;
    }),
  UPLOAD_MAX_FILE_SIZE_BYTES: z.coerce
    .number()
    .int()
    .positive()
    .default(10_485_760),

  // Reconciliacao de fotos de checklist (job agendado)
  CHECKLIST_PHOTO_RECONCILE_ENABLED: bool.default(false),
  CHECKLIST_PHOTO_RECONCILE_INTERVAL_MS: z.coerce
    .number()
    .int()
    .positive()
    .default(300_000),
  CHECKLIST_PHOTO_RECONCILE_STARTUP_DELAY_MS: z.coerce
    .number()
    .int()
    .nonnegative()
    .default(45_000),
  CHECKLIST_PHOTO_RECONCILE_LOCK_TTL_MS: z.coerce
    .number()
    .int()
    .positive()
    .default(240_000),
  CHECKLIST_PHOTO_RECONCILE_MAX_FILES: z.coerce
    .number()
    .int()
    .positive()
    .default(200),
  CHECKLIST_PHOTO_RECONCILE_MAX_RESPONSES: z.coerce
    .number()
    .int()
    .positive()
    .default(500),
  // Opcional: roots customizados (CSV/JSON). Cada root deve apontar para a pasta base de uploads.
  CHECKLIST_PHOTO_RECONCILE_SCAN_ROOTS: csvOrJsonArray,

  // Reconciliação automática de escala vs turnos realizados
  TURNO_RECONCILE_ENABLED: bool.default(false),
  TURNO_RECONCILE_CRON: z.string().default('0 2 * * *'), // Default: 2 AM
  TURNO_RECONCILE_LOCK_TTL_MS: z.coerce
    .number()
    .int()
    .positive()
    .default(600_000), // 10 minutes
});

export type Env = z.infer<typeof envSchema>;

export const env: Env = envSchema.parse(process.env);

export const isProd = env.NODE_ENV === 'production';
