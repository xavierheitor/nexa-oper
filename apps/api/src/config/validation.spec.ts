import { envValidationSchema } from './validation';

describe('Environment Validation Schema', () => {
  // Configuração mínima válida base
  const validBaseEnv = {
    NODE_ENV: 'development',
    DATABASE_URL: 'mysql://user:pass@localhost:3306/db',
    JWT_SECRET: '12345678901234567890123456789012', // 32 chars
  };

  describe('NODE_ENV = development (default)', () => {
    it('should pass without CORS_ORIGINS', () => {
      const env = { ...validBaseEnv };

      const { error, value } = envValidationSchema.validate(env);

      expect(error).toBeUndefined();
      expect(value.NODE_ENV).toBe('development');
    });

    it('should pass with CORS_ORIGINS', () => {
      const env = { ...validBaseEnv, CORS_ORIGINS: 'http://localhost:3000' };

      const { error } = envValidationSchema.validate(env);

      expect(error).toBeUndefined();
    });
  });

  describe('NODE_ENV = production', () => {
    const prodEnv = { ...validBaseEnv, NODE_ENV: 'production' };

    it('should fail if CORS_ORIGINS is missing', () => {
      const env: Record<string, unknown> = { ...prodEnv };
      delete env.CORS_ORIGINS;

      const { error } = envValidationSchema.validate(env);

      expect(error).toBeDefined();
      expect(error?.message).toContain(
        'CORS_ORIGINS é obrigatório em produção'
      );
    });

    it('should fail if CORS_ORIGINS is empty string', () => {
      const env = { ...prodEnv, CORS_ORIGINS: '' };

      const { error } = envValidationSchema.validate(env);

      // Joi.required() catches empty strings too by default for strings unless .allow('') is used
      expect(error).toBeDefined();
    });

    it('should pass if CORS_ORIGINS is provided as CSV', () => {
      const env = {
        ...prodEnv,
        CORS_ORIGINS: 'https://app.com,https://api.app.com',
      };

      const { error } = envValidationSchema.validate(env);

      expect(error).toBeUndefined();
    });

    it('should pass if CORS_ORIGINS is provided as JSON', () => {
      const env = { ...prodEnv, CORS_ORIGINS: '["https://app.com"]' };

      const { error } = envValidationSchema.validate(env);

      expect(error).toBeUndefined();
    });
  });
});
