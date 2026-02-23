/**
 * Barrel: única fonte de verdade para config.
 * Reexporta env e configureApp; o schema de variáveis de ambiente está em env.ts.
 */
export { env, envSchema, isProd } from './env';
export type { Env } from './env';
export { configureApp } from './configure-app';
