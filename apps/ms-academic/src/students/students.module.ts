import { Module } from '@nestjs/common';
import { StudentsService } from './students.service';
import { StudentsController } from './students.controller';
import { TenantModule } from '../common/tenant/tenant.module';

@Module({
  // F16: TenantModule replaces TypeOrmModule.forFeature([Student])
  imports: [TenantModule],
  controllers: [StudentsController],
  providers: [StudentsService],
  exports: [StudentsService],
})
export class StudentsModule {}
