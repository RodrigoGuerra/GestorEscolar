import { Injectable, NestInterceptor, ExecutionContext, CallHandler, ForbiddenException, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as jwt from 'jsonwebtoken';
import { Observable, from } from 'rxjs';
import { finalize, switchMap } from 'rxjs/operators';
import { DataSource } from 'typeorm';

@Injectable()
export class TenantInterceptor implements NestInterceptor {
  constructor(
    private dataSource: DataSource,
    private configService: ConfigService,
  ) {}

  async intercept(context: ExecutionContext, next: CallHandler): Promise<Observable<any>> {
    const request = context.switchToHttp().getRequest();

    // --- Manual JWT verification to populate request.user ---
    const authHeader = request.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1];
      const secret = this.configService.get<string>('JWT_SECRET');
      try {
        const decoded = jwt.verify(token, secret!) as any;
        request.user = decoded;
      } catch (error) {
        throw new UnauthorizedException('Invalid or expired token');
      }
    }

    const user = request.user;

    if (!user) {
      throw new UnauthorizedException('Authentication required for tenant context');
    }

    const authorizedTenants = user.tenants || [];
    const headerTenant = request.headers['x-tenant-id'];
    
    let tenantSchema: string | undefined;

    if (headerTenant && headerTenant !== 'undefined' && headerTenant !== '') {
      const authorized = authorizedTenants.find((t: any) => t.schema === headerTenant);
      if (!authorized && user.role !== 'admin') {
        throw new ForbiddenException(`Access to tenant ${headerTenant} is not authorized`);
      }
      tenantSchema = headerTenant;
    } else {
      tenantSchema = authorizedTenants[0]?.schema;
    }

    if (!tenantSchema) {
      if (user.role === 'admin') {
        tenantSchema = 'public';
      } else {
        throw new ForbiddenException('No valid tenant context found');
      }
    }

    const queryRunner = this.dataSource.createQueryRunner();
    
    return from(queryRunner.connect()).pipe(
      switchMap(async () => {
        await queryRunner.query(`SET search_path TO "${tenantSchema}", public`);
        request['tenantSchema'] = tenantSchema;
        return next.handle();
      }),
      switchMap(obs => obs),
      finalize(async () => {
        await queryRunner.release();
      })
    );
  }
}
