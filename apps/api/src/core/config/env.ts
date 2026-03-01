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
    if (!v) return undefined;
    const trimmed = v.trim();
    if (!trimmed) return undefined;

    // JSON array: ["https://a.com","https://b.com"]
    if (trimmed.startsWith('[')) {
      try {
        const arr: unknown = JSON.parse(trimmed);
        if (Array.isArray(arr)) return arr.map(String);
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

  // Upload storage: local | s3
  UPLOAD_STORAGE: z.enum(['local', 's3']).default('local'),
  UPLOAD_ROOT: z
    .string()
    .optional()
    .transform((v) => v?.trim() || undefined),
  UPLOAD_LEGACY_ROOTS: csvOrJsonArray,
  UPLOAD_BASE_URL: z
    .string()
    .optional()
    .transform((v) => v?.trim() || undefined),
  UPLOAD_MAX_FILE_SIZE_BYTES: z.coerce
    .number()
    .int()
    .positive()
    .default(10_485_760),
});

export type Env = z.infer<typeof envSchema>;

export const env: Env = envSchema.parse(process.env);

export const isProd = env.NODE_ENV === 'production';
