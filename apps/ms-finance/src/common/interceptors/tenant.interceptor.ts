import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  ForbiddenException,
  UnauthorizedException,
  BadRequestException,
} from '@nestjs/common';
import * as jwt from 'jsonwebtoken';
import { Observable, from } from 'rxjs';
import { finalize, switchMap } from 'rxjs/operators';
import { DataSource } from 'typeorm';

/** Allowed PostgreSQL schema names: lowercase letters, digits, underscores.
 *  Rejects anything that could escape a double-quoted identifier. */
const VALID_SCHEMA_RE = /^[a-z][a-z0-9_]{0,62}$/;

@Injectable()
export class TenantInterceptor implements NestInterceptor {
  // F10: DataSource only — Kong JWT plugin already verified the signature upstream
  constructor(private dataSource: DataSource) {}

  async intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Promise<Observable<any>> {
    const request = context.switchToHttp().getRequest();

    // F10: decode only (no verify) — Kong has already validated the JWT signature and expiry
    const authHeader = request.headers.authorization;
    if (
      authHeader &&
      authHeader.startsWith('Bearer ') &&
      authHeader !== 'Bearer undefined'
    ) {
      const token = authHeader.split(' ')[1];
      const decoded = jwt.decode(token) as any;
      if (!decoded) {
        throw new UnauthorizedException('Malformed token');
      }
      request.user = decoded;
    }

    const user = request.user;
    const headerTenant = request.headers['x-tenant-id'];

    if (!user) {
      throw new UnauthorizedException(
        'Authentication required for tenant context',
      );
    }

    const authorizedTenants = user.tenants || [];

    // Determine target schema
    let tenantSchema: string | undefined;

    if (headerTenant && headerTenant !== 'undefined' && headerTenant !== '') {
      if (headerTenant === 'public') {
        const userRole = user.role?.toLowerCase();
        const hasAuthorizedTenantRole = authorizedTenants.some((t: any) =>
          ['admin', 'owner', 'gestor'].includes(t.role?.toLowerCase()),
        );

        if (
          userRole === 'admin' ||
          userRole === 'gestor' ||
          userRole === 'manager' ||
          hasAuthorizedTenantRole
        ) {
          tenantSchema = 'public';
        } else {
          throw new ForbiddenException(`Access to tenant public is not authorized`);
        }
      } else {
        const authorized = authorizedTenants.find(
          (t: any) => t.schema === headerTenant,
        );
        if (
          !authorized &&
          user.role?.toLowerCase() !== 'admin' &&
          user.role?.toLowerCase() !== 'manager'
        ) {
          throw new ForbiddenException(
            `Access to tenant ${headerTenant} is not authorized`,
          );
        }
        tenantSchema = headerTenant;
      }
    } else {
      tenantSchema = authorizedTenants[0]?.schema;
    }

    if (!tenantSchema) {
      const userRole = user.role?.toLowerCase();
      const hasAuthorizedTenantRole = authorizedTenants.some((t: any) =>
        ['admin', 'owner', 'gestor'].includes(t.role?.toLowerCase()),
      );

      if (
        userRole === 'admin' ||
        userRole === 'gestor' ||
        userRole === 'manager' ||
        hasAuthorizedTenantRole
      ) {
        tenantSchema = 'public';
      } else {
        throw new ForbiddenException('No valid tenant context found');
      }
    }

    // F1: validate schema name before interpolating into SQL to prevent injection
    if (tenantSchema !== 'public' && !VALID_SCHEMA_RE.test(tenantSchema)) {
      throw new BadRequestException(
        `Invalid tenant schema identifier: "${tenantSchema}"`,
      );
    }

    const queryRunner = this.dataSource.createQueryRunner();

    return from(queryRunner.connect()).pipe(
      switchMap(async () => {
        await queryRunner.query(`SET search_path TO "${tenantSchema}", public`);
        request['tenantSchema'] = tenantSchema;
        request['queryRunner'] = queryRunner;
        return next.handle();
      }),
      switchMap((obs) => obs),
      finalize(async () => {
        await queryRunner.release();
      }),
    );
  }
}
