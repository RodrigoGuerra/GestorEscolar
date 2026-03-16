import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  ForbiddenException,
  UnauthorizedException,
} from '@nestjs/common';
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

  async intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Promise<Observable<any>> {
    const request = context.switchToHttp().getRequest();

    // --- Manual JWT verification to populate request.user ---
    const authHeader = request.headers.authorization;
    if (
      authHeader &&
      authHeader.startsWith('Bearer ') &&
      authHeader !== 'Bearer undefined'
    ) {
      const token = authHeader.split(' ')[1];
      const secret = this.configService.get<string>('JWT_SECRET');
      try {
        const decoded = jwt.verify(token, secret!) as any;
        request.user = decoded;
      } catch (error) {
        console.error(
          '[TenantInterceptor] JWT Verification Failed:',
          error.message,
        );
        throw new UnauthorizedException('Invalid or expired token');
      }
    }

    const user = request.user;
    const headerTenant = request.headers['x-tenant-id'];
    console.log('[TenantInterceptor] User Role:', user?.role);
    console.log('[TenantInterceptor] Header Tenant:', headerTenant);

    if (!user) {
      throw new UnauthorizedException(
        'Authentication required for tenant context',
      );
    }

    const authorizedTenants = user.tenants || [];

    // Determine target schema
    let tenantSchema: string | undefined;

    if (headerTenant && headerTenant !== 'undefined' && headerTenant !== '') {
      // Allow 'public' schema explicitly for fetching shared data like schools if user has right global role
      if (headerTenant === 'public') {
        const userRole = user.role?.toLowerCase();
        const hasAuthorizedTenantRole = authorizedTenants.some((t: any) => 
          ['admin', 'owner', 'gestor'].includes(t.role?.toLowerCase())
        );

        if (userRole === 'admin' || userRole === 'gestor' || userRole === 'manager' || hasAuthorizedTenantRole) {
          tenantSchema = 'public';
        } else {
          console.warn(`[TenantInterceptor] Forbidden: User role "${user.role}" and tenant roles not authorized for public tenant`);
          throw new ForbiddenException(`Access to tenant public is not authorized`);
        }
      } else {
        // Validate requested tenant against authorized list in JWT
        const authorized = authorizedTenants.find(
          (t: any) => t.schema === headerTenant,
        );
        if (
          !authorized &&
          user.role?.toLowerCase() !== 'admin' &&
          user.role?.toLowerCase() !== 'manager'
        ) {
          console.warn(
            `[TenantInterceptor] Forbidden: User not authorized for tenant ${headerTenant}`,
          );
          throw new ForbiddenException(
            `Access to tenant ${headerTenant} is not authorized`,
          );
        }
        tenantSchema = headerTenant;
      }
    } else {
      // Fallback to first authorized tenant if none specified
      tenantSchema = authorizedTenants[0]?.schema;
    }

    if (!tenantSchema) {
      const userRole = user.role?.toLowerCase();
      const hasAuthorizedTenantRole = authorizedTenants.some((t: any) => 
        ['admin', 'owner', 'gestor'].includes(t.role?.toLowerCase())
      );

      if (userRole === 'admin' || userRole === 'gestor' || userRole === 'manager' || hasAuthorizedTenantRole) {
        tenantSchema = 'public';
      } else {
        throw new ForbiddenException('No valid tenant context found');
      }
    }

    console.log('[TenantInterceptor] Resolved Schema:', tenantSchema);

    const queryRunner = this.dataSource.createQueryRunner();

    return from(queryRunner.connect()).pipe(
      switchMap(async () => {
        await queryRunner.query(`SET search_path TO "${tenantSchema}", public`);
        request['tenantSchema'] = tenantSchema;
        return next.handle();
      }),
      switchMap((obs) => obs),
      finalize(async () => {
        await queryRunner.release();
      }),
    );
  }
}
