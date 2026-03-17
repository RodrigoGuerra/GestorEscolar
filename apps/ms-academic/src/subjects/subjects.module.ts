import { Module } from '@nestjs/common';
import { SubjectsService } from './subjects.service';
import { SubjectsController } from './subjects.controller';
import { SchoolsModule } from '../schools/schools.module';
import { TenantModule } from '../common/tenant/tenant.module';

@Module({
  imports: [TenantModule, SchoolsModule],
  controllers: [SubjectsController],
  providers: [SubjectsService],
  exports: [SubjectsService],
})
export class SubjectsModule {}
