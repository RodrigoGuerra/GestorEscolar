import 'reflect-metadata';
import { DataSource } from 'typeorm';
import * as dotenv from 'dotenv';
import { User } from './users/entities/user.entity';
import { FranchiseTenant } from './tenants/entities/franchise-tenant.entity';

dotenv.config();

/** Used by the TypeORM CLI only — not imported by the NestJS app. */
export const AppDataSource = new DataSource({
  type: 'postgres',
  host: process.env.DATABASE_HOST || 'localhost',
  port: Number(process.env.DATABASE_PORT) || 5432,
  username: process.env.DATABASE_USER || 'admin',
  password: process.env.DATABASE_PASSWORD,
  database: process.env.DATABASE_NAME || 'gestor_escolar',
  schema: 'public',
  entities: [User, FranchiseTenant],
  migrations: [__dirname + '/migrations/*.{ts,js}'],
  synchronize: false,
});
