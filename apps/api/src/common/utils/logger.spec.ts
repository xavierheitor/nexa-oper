import { StandardLogger, sanitizeHeaders, sanitizeData } from './logger';

// Mock fs module
jest.mock('fs', () => {
  return {
    existsSync: jest.fn(),
    mkdirSync: jest.fn(),
    writeFileSync: jest.fn(),
    createWriteStream: jest.fn(),
    appendFileSync: jest.fn(), // Should not be called anymore
  };
});

async function setupLoggerTestEnv() {
  jest.resetModules();

  // Re-setup mock stream for each module reset
  const mockWriteStream = {
    write: jest.fn().mockReturnValue(true),
    end: jest.fn(cb => cb && cb()),
    on: jest.fn(),
  };

  // Configure mock implementation
  const fs = await import('fs');
  (fs.createWriteStream as jest.Mock).mockReturnValue(mockWriteStream);
  (fs.existsSync as jest.Mock).mockReturnValue(true);

  // Re-import logger to get fresh singleton
  const loggerModule = await import('./logger.js');
  const StandardLoggerClass = loggerModule.StandardLogger;
  const flushLogs = loggerModule.flushAndCloseLogs;

  const logger = new StandardLoggerClass();

  return { mockWriteStream, logger, flushLogs, fs };
}

describe('Logger Sanitization Utilities', () => {
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

describe('Async File Logging', () => {
  let logger: StandardLogger;
  let flushLogs: () => Promise<void>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let mockWriteStream: any;
  let fsMock: typeof import('fs');

  beforeEach(async () => {
    const env = await setupLoggerTestEnv();
    logger = env.logger;
    flushLogs = env.flushLogs;
    mockWriteStream = env.mockWriteStream;
    fsMock = env.fs;
  });

  it('should NOT use appendFileSync', () => {
    logger.log('Test message');
    expect(fsMock.appendFileSync).not.toHaveBeenCalled();
  });

  it('should create write stream and write to it on log', () => {
    logger.log('Test message');

    // Should create stream for app.log
    expect(fsMock.createWriteStream).toHaveBeenCalledWith(
      expect.stringContaining('app.log'),
      expect.objectContaining({ flags: 'a' })
    );

    // Should write to stream
    expect(mockWriteStream.write).toHaveBeenCalledWith(
      expect.stringContaining('Test message')
    );
  });

  it('should create separate stream for errors', () => {
    logger.error('Error message');

    // Should create stream for error.log
    expect(fsMock.createWriteStream).toHaveBeenCalledWith(
      expect.stringContaining('error.log'),
      expect.objectContaining({ flags: 'a' })
    );

    // Should write to error stream
    expect(mockWriteStream.write).toHaveBeenCalledWith(
      expect.stringContaining('Error message')
    );
  });

  it('should handle flush and close', async () => {
    // Log something to open streams
    logger.log('init');

    await flushLogs();

    expect(mockWriteStream.end).toHaveBeenCalled();
  });

  it('should be resilient to stream errors', () => {
    // Let's mimic createWriteStream failure
    (fsMock.createWriteStream as jest.Mock).mockImplementationOnce(() => {
      throw new Error('Permission denied');
    });

    // Should not throw
    expect(() => logger.log('Safe log')).not.toThrow();
  });
});
