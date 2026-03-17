import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { School } from './schools/entities/school.entity';
import { Subject } from './subjects/entities/subject.entity';
import { Class } from './classes/entities/class.entity';
import { Grade } from './grades/entities/grade.entity';
import { APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { TenantInterceptor } from './common/interceptors/tenant.interceptor';
import { JwtExtractGuard } from './common/guards/jwt-extract.guard';
import { RolesGuard } from './common/guards/roles.guard';

import { SchoolsModule } from './schools/schools.module';
import { SubjectsModule } from './subjects/subjects.module';
import { ClassesModule } from './classes/classes.module';
import { GradesModule } from './grades/grades.module';
import { StudentsModule } from './students/students.module';
import { Student } from './students/entities/student.entity';

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
        entities: [School, Subject, Class, Grade, Student],
        synchronize: true, // Enabled for development to ensure tables exist
        logging: true,
      }),
    }),
    SchoolsModule,
    SubjectsModule,
    ClassesModule,
    GradesModule,
    StudentsModule,
    TypeOrmModule.forFeature([School, Subject, Class, Grade, Student]),
    // F12: rate limiting — 20 req/s short burst, 500 req/min sustained
    ThrottlerModule.forRoot([
      { name: 'short', ttl: 1000, limit: 20 },
      { name: 'long', ttl: 60000, limit: 500 },
    ]),
  ],
  controllers: [AppController],
  providers: [
    AppService,
    // F12: ThrottlerGuard runs first
    { provide: APP_GUARD, useClass: ThrottlerGuard },
    // F11: guard chain — JwtExtractGuard runs first to populate request.user,
    // then RolesGuard checks @Roles() metadata; interceptor runs after guards
    { provide: APP_GUARD, useClass: JwtExtractGuard },
    { provide: APP_GUARD, useClass: RolesGuard },
    { provide: APP_INTERCEPTOR, useClass: TenantInterceptor },
  ],
})
export class AppModule {}
