import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { Employee } from './employees/entities/employee.entity';
import { BankDetails } from './bank-details/entities/bank-details.entity';
import { Address } from './employees/entities/address.entity';
import { TimeRecord } from './time-records/entities/time-record.entity';
import { APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { TenantInterceptor } from './common/interceptors/tenant.interceptor';
import { JwtExtractGuard } from './common/guards/jwt-extract.guard';
import { RolesGuard } from './common/guards/roles.guard';
import { EmployeesModule } from './employees/employees.module';
import { TimeRecordsModule } from './time-records/time-records.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        host: configService.get<string>('DATABASE_HOST'),
        port: configService.get<number>('DATABASE_PORT'),
        username: configService.get<string>('DATABASE_USER'),
        password: configService.get<string>('DATABASE_PASSWORD'),
        database: configService.get<string>('DATABASE_NAME'),
        entities: [Employee, BankDetails, Address, TimeRecord],
        // F20: never auto-sync in production — run migrations instead
        synchronize: false,
        logging: true,
      }),
    }),
    EmployeesModule,
    TimeRecordsModule,
    // F16: TypeOrmModule.forFeature() removed — services now use TenantRepositoryService
    // F12: rate limiting
    ThrottlerModule.forRoot([
      { name: 'short', ttl: 1000, limit: 20 },
      { name: 'long', ttl: 60000, limit: 500 },
    ]),
  ],
  controllers: [AppController],
  providers: [
    AppService,
    { provide: APP_GUARD, useClass: ThrottlerGuard },
    { provide: APP_GUARD, useClass: JwtExtractGuard },
    { provide: APP_GUARD, useClass: RolesGuard },
    { provide: APP_INTERCEPTOR, useClass: TenantInterceptor },
  ],
})
export class AppModule {}
