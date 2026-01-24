/* eslint-disable @typescript-eslint/unbound-method */
import { MobileUsersService } from '@core/mobile-users/services/mobile-users.service';
import { UnauthorizedException, ForbiddenException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Test, TestingModule } from '@nestjs/testing';
import * as bcrypt from 'bcrypt';

import { AuthService } from './auth.service';

// Mock bcrypt
jest.mock('bcrypt');
const mockedBcrypt = bcrypt as jest.Mocked<typeof bcrypt>;

describe('AuthService', () => {
  let service: AuthService;
  let mobileUsersService: MobileUsersService;
  let jwtService: JwtService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: MobileUsersService,
          useValue: {
            findByMatricula: jest.fn(),
            findById: jest.fn(),
          },
        },
        {
          provide: JwtService,
          useValue: {
            sign: jest.fn(),
            verify: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    mobileUsersService = module.get<MobileUsersService>(MobileUsersService);
    jwtService = module.get<JwtService>(JwtService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('validateLogin', () => {
    it('should return tokens and user data for valid credentials', async () => {
      const mockUser = {
        id: 1,
        username: 'testuser',
        password: 'hashedpassword',
        createdAt: new Date(),
        createdBy: 'system',
        updatedAt: null,
        updatedBy: null,
        deletedAt: null,
        deletedBy: null,
      };

      jest
        .spyOn(mobileUsersService, 'findByMatricula')
        .mockResolvedValue(mockUser);
      mockedBcrypt.compare.mockResolvedValue(true as never);
      jest.spyOn(jwtService, 'sign').mockReturnValue('mock-token');

      const result = await service.validateLogin('testuser', 'password123');

      expect(mobileUsersService.findByMatricula).toHaveBeenCalledWith(
        'testuser'
      );
      expect(bcrypt.compare).toHaveBeenCalledWith(
        'password123',
        'hashedpassword'
      );
      expect(jwtService.sign).toHaveBeenCalledTimes(2);
      expect(result).toMatchObject({
        token: expect.any(String),
        refreshToken: expect.any(String),
        expiresAt: expect.any(String),
        refreshTokenExpiresAt: expect.any(String),
        usuario: {
          id: 1,
          nome: 'testuser',
          matricula: 'testuser',
        },
      });
    });

    it('should throw UnauthorizedException for invalid credentials', async () => {
      jest.spyOn(mobileUsersService, 'findByMatricula').mockResolvedValue(null);

      await expect(
        service.validateLogin('invaliduser', 'password123')
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException for invalid password', async () => {
      const mockUser = {
        id: 1,
        username: 'testuser',
        password: 'hashedpassword',
        createdAt: new Date(),
        createdBy: 'system',
        updatedAt: null,
        updatedBy: null,
        deletedAt: null,
        deletedBy: null,
      };

      jest
        .spyOn(mobileUsersService, 'findByMatricula')
        .mockResolvedValue(mockUser);
      mockedBcrypt.compare.mockResolvedValue(false as never);

      await expect(
        service.validateLogin('testuser', 'wrongpassword')
      ).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('refreshToken', () => {
    it('should return new tokens for valid refresh token', async () => {
      const mockUser = {
        id: 1,
        username: 'testuser',
        password: 'hashedpassword',
        createdAt: new Date(),
        createdBy: 'system',
        updatedAt: null,
        updatedBy: null,
        deletedAt: null,
        deletedBy: null,
      };

      const mockPayload = { sub: 1, matricula: 'testuser' };

      jest.spyOn(jwtService, 'verify').mockReturnValue(mockPayload);
      jest.spyOn(mobileUsersService, 'findById').mockResolvedValue(mockUser);
      jest.spyOn(jwtService, 'sign').mockReturnValue('new-token');

      const result = await service.refreshToken('valid-refresh-token');

      expect(jwtService.verify).toHaveBeenCalledWith('valid-refresh-token');
      expect(mobileUsersService.findById).toHaveBeenCalledWith(1);
      expect(jwtService.sign).toHaveBeenCalledTimes(2);
      expect(result).toMatchObject({
        token: expect.any(String),
        refreshToken: expect.any(String),
        expiresAt: expect.any(String),
        refreshTokenExpiresAt: expect.any(String),
        usuario: {
          id: 1,
          nome: 'testuser',
          matricula: 'testuser',
        },
      });
    });

    it('should throw ForbiddenException for invalid refresh token', async () => {
      jest.spyOn(jwtService, 'verify').mockImplementation(() => {
        throw new Error('Invalid token');
      });

      await expect(service.refreshToken('invalid-token')).rejects.toThrow(
        ForbiddenException
      );
    });

    it('should throw ForbiddenException when user not found', async () => {
      const mockPayload = { sub: 1, matricula: 'testuser' };

      jest.spyOn(jwtService, 'verify').mockReturnValue(mockPayload);
      jest.spyOn(mobileUsersService, 'findById').mockResolvedValue(null);

      await expect(service.refreshToken('valid-refresh-token')).rejects.toThrow(
        ForbiddenException
      );
    });
  });
});
