import { ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';

import { JwtStrategy } from './jwt.strategy';

describe('JwtStrategy', () => {
  let strategy: JwtStrategy;

  const mockConfigService = {
    get: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined when JWT_SECRET is present', async () => {
    mockConfigService.get.mockReturnValue(
      'super_secret_key_32_chars_minimum_length'
    );

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        JwtStrategy,
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
      ],
    }).compile();

    strategy = module.get<JwtStrategy>(JwtStrategy);
    expect(strategy).toBeDefined();
  });

  it('should throw error when JWT_SECRET is missing', async () => {
    mockConfigService.get.mockReturnValue(undefined);

    try {
      await Test.createTestingModule({
        providers: [
          JwtStrategy,
          {
            provide: ConfigService,
            useValue: mockConfigService,
          },
        ],
      }).compile();
      fail('Should have thrown an error');
    } catch (error) {
      expect(error).toBeDefined();
      // Note: NestJS testing module creation might wrap the error, but the constructor throws straightforward Error
      expect((error as Error).message).toContain(
        'JWT_SECRET não está configurado'
      );
    }
  });
});
