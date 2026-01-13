import { getCorsOrigins } from './cors';

describe('getCorsOrigins', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    jest.resetModules();
    process.env = { ...originalEnv };
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  it('should allow all in development when CORS_ORIGINS is missing', () => {
    process.env.NODE_ENV = 'development';
    delete process.env.CORS_ORIGINS;

    const result = getCorsOrigins();
    expect(typeof result).toBe('function');
    if (typeof result === 'function') {
      expect(result('any-origin')).toBe(true);
    }
  });

  it('should deny all in production when CORS_ORIGINS is missing', () => {
    process.env.NODE_ENV = 'production';
    delete process.env.CORS_ORIGINS;

    const result = getCorsOrigins();
    expect(typeof result).toBe('function');
    if (typeof result === 'function') {
      expect(result('http://scary-site.com')).toBe(false);
    }
  });

  it('should return array from CSV in production', () => {
    process.env.NODE_ENV = 'production';
    process.env.CORS_ORIGINS = 'http://example.com, https://test.com';

    const result = getCorsOrigins();
    expect(Array.isArray(result)).toBe(true);
    expect(result).toEqual(['http://example.com', 'https://test.com']);
  });

  it('should return array from JSON in production', () => {
    process.env.NODE_ENV = 'production';
    process.env.CORS_ORIGINS = '["http://json.com", "https://api.json.com"]';

    const result = getCorsOrigins();
    expect(Array.isArray(result)).toBe(true);
    expect(result).toEqual(['http://json.com', 'https://api.json.com']);
  });

  it('should fallback to deny if JSON is empty array', () => {
    process.env.NODE_ENV = 'production';
    process.env.CORS_ORIGINS = '[]';

    const result = getCorsOrigins();
    expect(typeof result).toBe('function');
    if (typeof result === 'function') {
      expect(result('any')).toBe(false);
    }
  });

  it('should fallback to deny if CSV string is just commas or whitespace', () => {
    process.env.NODE_ENV = 'production';
    process.env.CORS_ORIGINS = ' , , ';

    const result = getCorsOrigins();
    expect(typeof result).toBe('function');
    if (typeof result === 'function') {
      expect(result('any')).toBe(false);
    }
  });
});
