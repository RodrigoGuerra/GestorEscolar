import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FranchiseTenant } from './entities/franchise-tenant.entity';

@Module({
  imports: [TypeOrmModule.forFeature([FranchiseTenant])],
  exports: [TypeOrmModule],
})
export class TenantsModule {}
