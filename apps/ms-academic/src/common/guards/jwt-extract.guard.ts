import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import * as jwt from 'jsonwebtoken';
import { ConfigService } from '@nestjs/config';

/**
 * Decodes AND verifies the JWT from the Authorization header, then populates
 * request.user. Using jwt.verify() here provides defense-in-depth: even if
 * a request bypasses Kong, a forged token will be rejected.
 * Must run before RolesGuard.
 */
@Injectable()
export class JwtExtractGuard implements CanActivate {
  constructor(private readonly configService: ConfigService) {}

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

    const secret = this.configService.get<string>('JWT_SECRET');
    if (!secret) {
      throw new UnauthorizedException('JWT secret not configured');
    }

    let decoded: any;
    try {
      decoded = jwt.verify(token, secret) as any;
    } catch {
      throw new UnauthorizedException('Invalid or expired token');
    }

    // include both `sub` and `userId` so IDOR checks work regardless of source
    request.user = {
      sub: decoded.sub,
      userId: decoded.sub,
      email: decoded.email,
      role: decoded.role,
      tenants: decoded.tenants,
    };

    return true;
  }
}
