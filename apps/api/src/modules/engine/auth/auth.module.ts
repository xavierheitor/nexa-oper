import { Module } from '@nestjs/common';
import { AuthController } from './controllers/auth.controller';
import { JwtModule } from '@nestjs/jwt';
import { JwtStrategy } from './strategies/jwt.strategy';
import { AuthService } from './services/auth.service';
import { ContractPermissionsService } from './services/contract-permissions.service';
import { ContractPermissionsGuard } from './guards/contract-permissions.guard';
import { PassportModule } from '@nestjs/passport';
import { MobileUsersModule } from '../mobile-users/mobile-users.module';
import { DatabaseModule } from '@database/database.module';

/**
 * Obtém o JWT_SECRET validado
 *
 * Garante que JWT_SECRET está configurado e é seguro.
 * A validação completa é feita no bootstrap, mas esta função
 * fornece um erro claro se a variável não estiver disponível.
 *
 * @returns JWT_SECRET configurado
 * @throws {Error} Se JWT_SECRET não estiver configurado
 */
function getJwtSecret(): string {
  const secret = process.env.JWT_SECRET;
  if (!secret || secret.trim() === '') {
    throw new Error(
      'JWT_SECRET não está configurado. Configure a variável de ambiente antes de iniciar a aplicação.'
    );
  }
  if (secret === 'secret' || secret.length < 32) {
    throw new Error(
      'JWT_SECRET deve ser uma string segura com pelo menos 32 caracteres e não pode ser "secret"'
    );
  }
  return secret;
}

@Module({
  imports: [
    DatabaseModule,
    MobileUsersModule,
    PassportModule,
    JwtModule.register({
      secret: getJwtSecret(),
      // Tokens com expiração configurada no serviço (access: 7d, refresh: 30d)
    }),
  ],
  providers: [
    AuthService,
    JwtStrategy,
    ContractPermissionsService,
    ContractPermissionsGuard,
  ],
  controllers: [AuthController],
  exports: [AuthService, ContractPermissionsService, ContractPermissionsGuard],
})
export class AuthModule {}
