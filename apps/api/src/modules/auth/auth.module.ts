import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { AppError } from '../../core/errors/app-error';
import { env } from '../../core/config/env';
import { DatabaseModule } from '../../database';
import { ContractPermissionsModule } from './modules/contract-permissions/contract-permissions.module';
import { LoginUseCase } from './application/use-cases/login.use-case';
import { RefreshTokenUseCase } from './application/use-cases/refresh-token.use-case';
import { ValidateAuthUserUseCase } from './application/use-cases/validate-auth-user.use-case';
import { TokenPairFactory } from './application/services/token-pair.factory';
import { AUTH_SESSION_REPOSITORY } from './domain/ports/auth-session-repository.port';
import { AuthController } from './controllers/auth.controller';
import { AuthService } from './services/auth.service';
import { JwtStrategy } from './strategies/jwt.strategy';

if (!env.JWT_SECRET || env.JWT_SECRET.length < 32) {
  throw AppError.internal('JWT_SECRET deve ter pelo menos 32 caracteres');
}

@Module({
  imports: [
    DatabaseModule,
    ContractPermissionsModule,
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.register({
      secret: env.JWT_SECRET,
      signOptions: { expiresIn: '7d' },
    }),
  ],
  controllers: [AuthController],
  providers: [
    AuthService,
    TokenPairFactory,
    LoginUseCase,
    RefreshTokenUseCase,
    ValidateAuthUserUseCase,
    { provide: AUTH_SESSION_REPOSITORY, useExisting: AuthService },
    JwtStrategy,
  ],
  exports: [AuthService],
})
export class AuthModule {}
