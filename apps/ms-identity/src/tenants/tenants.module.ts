import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FranchiseTenant } from './entities/franchise-tenant.entity';
import { School } from './entities/school.entity';

@Module({
  imports: [TypeOrmModule.forFeature([FranchiseTenant, School])],
  exports: [TypeOrmModule],
})
export class TenantsModule {}
