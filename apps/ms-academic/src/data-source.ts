import 'reflect-metadata';
import { DataSource } from 'typeorm';
import * as dotenv from 'dotenv';
import { School } from './schools/entities/school.entity';
import { Subject } from './subjects/entities/subject.entity';
import { Class } from './classes/entities/class.entity';
import { Grade } from './grades/entities/grade.entity';
import { Student } from './students/entities/student.entity';

dotenv.config();

/** Used by the TypeORM CLI only — not imported by the NestJS app. */
export const AppDataSource = new DataSource({
  type: 'postgres',
  host: process.env.DATABASE_HOST || 'localhost',
  port: Number(process.env.DATABASE_PORT) || 5432,
  username: process.env.DATABASE_USER || 'admin',
  password: process.env.DATABASE_PASSWORD,
  database: process.env.DATABASE_NAME || 'gestor_escolar',
  entities: [School, Subject, Class, Grade, Student],
  migrations: [__dirname + '/migrations/*.{ts,js}'],
  synchronize: false,
});
