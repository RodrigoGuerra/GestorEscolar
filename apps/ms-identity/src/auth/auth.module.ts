import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { GoogleStrategy } from './strategies/google.strategy';
import { JwtStrategy } from './strategies/jwt.strategy';
import { UsersModule } from '../users/users.module';
import { TenantsModule } from '../tenants/tenants.module';
import { RefreshTokenService } from './refresh-token.service';

@Module({
  imports: [
    UsersModule,
    TenantsModule,
    PassportModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET'),
        // F9: issuer must match the key_claim_name (iss) in kong.yml jwt plugin consumer
        // F24: 15m short-lived access tokens — use POST /auth/refresh to rotate
        signOptions: { expiresIn: '15m', issuer: 'gestor-escolar-app' },
      }),
    }),
  ],
  providers: [AuthService, GoogleStrategy, JwtStrategy, RefreshTokenService],
  controllers: [AuthController],
  exports: [AuthService],
})
export class AuthModule {}
