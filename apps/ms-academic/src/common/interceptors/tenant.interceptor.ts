import { Injectable, NestInterceptor, ExecutionContext, CallHandler, BadRequestException } from '@nestjs/common';
import { Observable } from 'rxjs';
import { DataSource } from 'typeorm';

@Injectable()
export class TenantInterceptor implements NestInterceptor {
  constructor(private dataSource: DataSource) {}

  async intercept(context: ExecutionContext, next: CallHandler): Promise<Observable<any>> {
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user || !user.tenants || user.tenants.length === 0) {
      // In a real scenario, we might allow public access to some routes, 
      // but for academia, a tenant is usually required.
      // For now, let's assume the first tenant or a specific header.
      // The PRD says the JWT contains the franchise_schema.
    }

    // Defaulting to a specific schema for testing or extracting from user payload
    // In ms-identity, we put 'tenants' in the payload.
    // Let's assume the request header 'x-tenant-schema' for flexibility or extract from JWT.
    const tenantSchema = request.headers['x-tenant-schema'] || (user?.tenants && user.tenants[0]?.schema);

    if (!tenantSchema) {
      throw new BadRequestException('Tenant schema not provided');
    }

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.query(`SET search_path TO "${tenantSchema}", public`);
    
    // Attach queryRunner to request so services can use it if needed, 
    // or rely on the fact that the connection session now has the search_path set.
    // Note: In a pooled environment, this SET search_path is session-scoped.
    // For TypeORM, we need to be careful with connection pooling.
    
    request['tenantSchema'] = tenantSchema;

    return next.handle();
  }
}
