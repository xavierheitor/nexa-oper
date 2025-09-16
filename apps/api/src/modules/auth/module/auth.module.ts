import { Module } from '@nestjs/common';
import { AuthController } from '../controller/auth.controller';
import { MobileUsersModule } from 'src/modules/mobile-users/mobile-users.module';
import { JwtModule } from '@nestjs/jwt';
import { JwtStrategy } from '../strategy/jwt.strategy';
import { AuthService } from '../service/auth.service';
import { ContractPermissionsService } from '../service/contract-permissions.service';
import { ContractPermissionsGuard } from '../guard/contract-permissions.guard';
import { PassportModule } from '@nestjs/passport';

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
  exports: [ContractPermissionsService, ContractPermissionsGuard],
})
export class AuthModule {}
