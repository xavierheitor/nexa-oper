import * as Joi from 'joi';

export const envValidationSchema = Joi.object({
  NODE_ENV: Joi.string().valid('development', 'test', 'production').default('development'),
  PORT: Joi.number().port().default(3001),

  // Segurança / Auth
  JWT_SECRET: Joi.string()
    .min(32)
    .invalid('secret')
    .required()
    .messages({
      'any.required': 'JWT_SECRET é obrigatório',
      'string.min': 'JWT_SECRET deve ter pelo menos 32 caracteres',
      'any.invalid': 'JWT_SECRET não pode ser "secret"',
    }),

  // Banco de dados
  DATABASE_URL: Joi.string().uri().required(),

  // CORS
  CORS_ORIGINS: Joi.string().optional(),

  // Rate limiting
  RATE_LIMIT_WINDOW_MS: Joi.number().min(1000).default(60_000),
  RATE_LIMIT_MAX_PER_IP: Joi.number().min(1).default(20),
  RATE_LIMIT_MAX_PER_USER: Joi.number().min(1).default(5),

  // Uploads
  UPLOAD_ROOT: Joi.string().optional().description('Caminho absoluto para pasta de uploads (padrão: ./uploads)'),
  UPLOAD_BASE_URL: Joi.string().uri().optional().description('URL base pública para acesso aos uploads (ex: https://storage.seudominio.com)'),
});


