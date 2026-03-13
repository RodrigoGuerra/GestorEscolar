import { Injectable, NestInterceptor, ExecutionContext, CallHandler, BadRequestException } from '@nestjs/common';
import { Observable } from 'rxjs';
import { DataSource } from 'typeorm';

@Injectable()
export class TenantInterceptor implements NestInterceptor {
  constructor(private dataSource: DataSource) {}

  async intercept(context: ExecutionContext, next: CallHandler): Promise<Observable<any>> {
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    const tenantSchema = request.headers['x-tenant-schema'] || (user?.tenants && user.tenants[0]?.schema);

    if (!tenantSchema) {
      throw new BadRequestException('Tenant schema not provided');
    }

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.query(`SET search_path TO "${tenantSchema}", public`);
    
    request['tenantSchema'] = tenantSchema;

    return next.handle();
  }
}
