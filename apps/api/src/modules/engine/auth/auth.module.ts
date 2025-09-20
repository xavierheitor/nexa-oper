import { Module } from '@nestjs/common';
import { AuthController } from './controllers/auth.controller';
import { JwtModule } from '@nestjs/jwt';
import { JwtStrategy } from './strategies/jwt.strategy';
import { AuthService } from './services/auth.service';
import { ContractPermissionsService } from './services/contract-permissions.service';
import { ContractPermissionsGuard } from './guards/contract-permissions.guard';
import { PassportModule } from '@nestjs/passport';
import { MobileUsersModule } from '../mobile-users/mobile-users.module';

@Module({
  imports: [
    MobileUsersModule,
    PassportModule,
    JwtModule.register({
      secret: process.env.JWT_SECRET || 'secret',
      // ✅ Sem expiração - tokens válidos até logout manual
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
