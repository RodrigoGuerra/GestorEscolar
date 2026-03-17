import 'reflect-metadata';
import { DataSource } from 'typeorm';
import * as dotenv from 'dotenv';
import { Employee } from './employees/entities/employee.entity';
import { BankDetails } from './bank-details/entities/bank-details.entity';
import { Address } from './employees/entities/address.entity';
import { TimeRecord } from './time-records/entities/time-record.entity';

dotenv.config();

/** Used by the TypeORM CLI only — not imported by the NestJS app. */
export const AppDataSource = new DataSource({
  type: 'postgres',
  host: process.env.DATABASE_HOST || 'localhost',
  port: Number(process.env.DATABASE_PORT) || 5432,
  username: process.env.DATABASE_USER || 'admin',
  password: process.env.DATABASE_PASSWORD,
  database: process.env.DATABASE_NAME || 'gestor_escolar',
  entities: [Employee, BankDetails, Address, TimeRecord],
  migrations: [__dirname + '/migrations/*.{ts,js}'],
  synchronize: false,
});
