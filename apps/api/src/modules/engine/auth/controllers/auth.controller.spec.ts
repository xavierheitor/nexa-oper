/* eslint-disable @typescript-eslint/unbound-method */
import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from './auth.controller';
import { AuthService } from '../services/auth.service';

describe('AuthController', () => {
  let controller: AuthController;
  let authService: AuthService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        {
          provide: AuthService,
          useValue: {
            validateLogin: jest.fn(),
            refreshToken: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<AuthController>(AuthController);
    authService = module.get<AuthService>(AuthService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('login', () => {
    it('should call authService.validateLogin with correct parameters', async () => {
      const loginDto = { matricula: 'testuser', senha: 'password123' };
      const mockResponse = {
        token: 'mock-token',
        refreshToken: 'mock-refresh-token',
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        refreshTokenExpiresAt: new Date(
          Date.now() + 30 * 24 * 60 * 60 * 1000
        ).toISOString(),
        usuario: {
          id: 1,
          nome: 'testuser',
          matricula: 'testuser',
        },
      };

      jest.spyOn(authService, 'validateLogin').mockResolvedValue(mockResponse);

      const result = await controller.login(loginDto);

      expect(authService.validateLogin).toHaveBeenCalledWith(
        'testuser',
        'password123'
      );
      expect(result).toEqual(mockResponse);
    });
  });

  describe('refresh', () => {
    it('should call authService.refreshToken with correct parameters', async () => {
      const refreshDto = { refreshToken: 'mock-refresh-token' };
      const mockResponse = {
        token: 'new-token',
        refreshToken: 'new-refresh-token',
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        refreshTokenExpiresAt: new Date(
          Date.now() + 30 * 24 * 60 * 60 * 1000
        ).toISOString(),
        usuario: {
          id: 1,
          nome: 'testuser',
          matricula: 'testuser',
        },
      };

      jest.spyOn(authService, 'refreshToken').mockResolvedValue(mockResponse);

      const result = await controller.refresh(refreshDto);

      expect(authService.refreshToken).toHaveBeenCalledWith(
        'mock-refresh-token'
      );
      expect(result).toEqual(mockResponse);
    });
  });
});
