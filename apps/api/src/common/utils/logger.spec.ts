import { StandardLogger, sanitizeHeaders, sanitizeData } from './logger';

describe('Logger Utilities', () => {
  describe('sanitizeHeaders', () => {
    it('should mask authorization header', () => {
      const headers = {
        'content-type': 'application/json',
        authorization: 'Bearer secret-token',
      };
      const sanitized = sanitizeHeaders(headers);
      expect(sanitized.authorization).toBe('****');
      expect(sanitized['content-type']).toBe('application/json');
    });

    it('should mask sensitive headers regardless of case', () => {
      const headers = { 'X-Auth-Token': 'secret' };
      const sanitized = sanitizeHeaders(headers);
      expect(sanitized['X-Auth-Token']).toBe('****');
    });
  });

  describe('sanitizeData', () => {
    it('should mask sensitive fields in object', () => {
      const data = {
        name: 'John',
        password: 'supersecret',
        email: 'john@example.com',
      };
      const sanitized = sanitizeData(data);
      expect(sanitized.password).toBe('****');
      expect(sanitized.name).toBe('John');
    });

    it('should mask sensitive fields recursively', () => {
      const data = {
        user: {
          credentials: {
            password: 'secret',
          },
        },
      };
      const sanitized = sanitizeData(data);
      // 'credentials' itself is a sensitive field, so it is masked entirely
      expect(sanitized.user.credentials).toBe('****');
    });

    it('should handle arrays', () => {
      const data = [{ password: '123' }, { token: 'abc' }];
      const sanitized = sanitizeData(data);
      expect(sanitized[0].password).toBe('****');
      expect(sanitized[1].token).toBe('****');
    });
  });
});
