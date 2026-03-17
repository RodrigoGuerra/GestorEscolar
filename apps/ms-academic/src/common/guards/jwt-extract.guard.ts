import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import * as jwt from 'jsonwebtoken';

/**
 * F11: Decodes the JWT from the Authorization header and populates request.user.
 * Does NOT verify the signature — Kong has already done that upstream.
 * Must run before RolesGuard.
 */
@Injectable()
export class JwtExtractGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const authHeader = request.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedException('Missing or invalid Authorization header');
    }

    const token = authHeader.split(' ')[1];
    if (!token || token === 'undefined') {
      throw new UnauthorizedException('Missing token');
    }

    const decoded = jwt.decode(token) as any;
    if (!decoded) {
      throw new UnauthorizedException('Malformed token');
    }

    request.user = {
      userId: decoded.sub,
      email: decoded.email,
      role: decoded.role,
      tenants: decoded.tenants,
    };

    return true;
  }
}
