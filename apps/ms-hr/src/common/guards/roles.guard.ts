import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { UserRole } from '../enums/user-role.enum';
import { ROLES_KEY } from '../decorators/roles.decorator';

/**
 * F11: Checks request.user.role against the @Roles() metadata on the handler.
 * Must run AFTER JwtExtractGuard (which populates request.user).
 * If no @Roles() is set on a handler, access is granted to any authenticated user.
 */
@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<UserRole[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!requiredRoles || requiredRoles.length === 0) {
      return true;
    }

    const { user } = context.switchToHttp().getRequest();
    const userRole = user?.role?.toUpperCase() as UserRole;

    if (!requiredRoles.includes(userRole)) {
      throw new ForbiddenException(
        `Role '${userRole}' is not authorized to access this resource`,
      );
    }

    return true;
  }
}
