import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { PassportModule } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';
import { User } from './entities/user.entity';
import { FranchiseTenant } from '../tenants/entities/franchise-tenant.entity';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { JwtStrategy } from '../auth/strategies/jwt.strategy';

@Module({
  imports: [
    TypeOrmModule.forFeature([User, FranchiseTenant]),
    ClientsModule.registerAsync([
      {
        name: 'IDENTITY_SERVICE',
        imports: [ConfigModule],
        inject: [ConfigService],
        useFactory: (configService: ConfigService) => ({
          transport: Transport.RMQ,
          options: {
            urls: [configService.get<string>('RABBITMQ_URL') || 'amqp://localhost:5672'],
            queue: 'school_events_queue',
            queueOptions: {
              durable: true,
            },
          },
        }),
      },
    ]),
    // F2: register Passport + JWT here (instead of importing AuthModule) to avoid circular dependency
    PassportModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET'),
        // I1: keep in sync with auth.module.ts — 15m to match F24 policy
        signOptions: { expiresIn: '15m', issuer: 'gestor-escolar-app' },
      }),
    }),
  ],
  controllers: [UsersController],
  providers: [
    UsersService,
    // F2: JwtStrategy must be in providers so AuthGuard('jwt') can resolve it
    JwtStrategy,
  ],
  exports: [UsersService, TypeOrmModule],
})
export class UsersModule {}
