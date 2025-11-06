import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
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
 * Obtém o JWT_SECRET validado do ConfigService
 *
 * Garante que JWT_SECRET está configurado e é seguro.
 * A validação completa é feita no schema de validação do ConfigModule,
 * mas esta função fornece uma validação adicional para garantir segurança.
 *
 * @param configService - Instância do ConfigService do NestJS
 * @returns JWT_SECRET configurado
 * @throws {Error} Se JWT_SECRET não estiver configurado ou for inseguro
 */
function getJwtSecret(configService: ConfigService): string {
  const secret = configService.get<string>('JWT_SECRET');
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
    JwtModule.registerAsync({
      useFactory: (configService: ConfigService) => {
        return {
          secret: getJwtSecret(configService),
          // Tokens com expiração configurada no serviço (access: 7d, refresh: 30d)
        };
      },
      inject: [ConfigService],
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
