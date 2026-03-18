import {
  Controller,
  Get,
  Post,
  UseGuards,
  Req,
  Res,
  Logger,
  HttpStatus,
  UnauthorizedException,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ConfigService } from '@nestjs/config';
import { Throttle } from '@nestjs/throttler';
import { AuthService } from './auth.service';
import type { Response, Request } from 'express';

const REFRESH_COOKIE = 'refresh_token';
const ACCESS_COOKIE = 'auth_token';
const REFRESH_TTL_MS = 30 * 24 * 60 * 60 * 1000; // 30 days

@Controller('auth')
export class AuthController {
  private readonly logger = new Logger(AuthController.name);

  constructor(
    private readonly authService: AuthService,
    private readonly configService: ConfigService,
  ) {}

  // F12: strict throttle on OAuth entry points — max 5 per second, 20 per minute
  @Throttle({ short: { limit: 5, ttl: 1000 }, long: { limit: 20, ttl: 60000 } })
  @Get('google')
  @UseGuards(AuthGuard('google'))
  async googleAuth(@Req() req: Request) {}

  @Throttle({ short: { limit: 5, ttl: 1000 }, long: { limit: 20, ttl: 60000 } })
  @Get('google/callback')
  @UseGuards(AuthGuard('google'))
  async googleAuthRedirect(@Req() req: Request, @Res() res: Response) {
    try {
      this.logger.log('Starting Google Auth Callback');
      // F24: now returns both accessToken (15m) and refreshToken (opaque, 30d in Redis)
      const { accessToken, refreshToken } = await this.authService.validateOAuthUser(req.user);
      this.logger.log('Access token generated successfully');

      const isProduction = this.configService.get<string>('NODE_ENV') === 'production';
      const cookieDomain = this.configService.get<string>('COOKIE_DOMAIN') || undefined;
      const frontendUrl = this.configService.get<string>('FRONTEND_URL') || 'http://localhost:5173';

      const cookieBase = {
        httpOnly: true,
        secure: isProduction,
        sameSite: 'strict' as const,
        domain: cookieDomain,
        path: '/',
      };

      // F3/F24: short-lived access token (15m) — NOT in the URL
      res.cookie(ACCESS_COOKIE, accessToken, { ...cookieBase, maxAge: 15 * 60 * 1000 });
      // F24: long-lived opaque refresh token (30d)
      res.cookie(REFRESH_COOKIE, refreshToken, { ...cookieBase, maxAge: REFRESH_TTL_MS });

      return res.redirect(`${frontendUrl}/login/success`);
    } catch (error) {
      // F4: log stack trace server-side only — never expose it to the client
      this.logger.error('Error in Google Auth Callback', error.stack);
      return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
        message: 'Authentication failed',
      });
    }
  }

  @Get('profile')
  @UseGuards(AuthGuard('jwt'))
  getProfile(@Req() req: Request) {
    return req.user;
  }

  /**
   * F3: Exchange the HttpOnly session cookie for an access token + user profile.
   */
  @Get('token')
  @UseGuards(AuthGuard('jwt'))
  getToken(@Req() req: any, @Res() res: Response) {
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate');
    res.setHeader('Pragma', 'no-cache');
    return res.json({ user: req.user });
  }

  /**
   * F24: Rotate refresh token — validates the opaque refresh_token cookie,
   * issues a new 15m access_token and a rotated refresh_token (30d in Redis).
   * Strict throttle: max 5 requests per 10s, 15 per minute — prevents abuse.
   */
  @Throttle({ short: { limit: 5, ttl: 10000 }, long: { limit: 15, ttl: 60000 } })
  @Post('refresh')
  async refresh(@Req() req: Request, @Res() res: Response) {
    const token = (req as any).cookies?.[REFRESH_COOKIE];
    if (!token) throw new UnauthorizedException('No refresh token');

    const { accessToken, refreshToken } = await this.authService.refreshAccessToken(token);

    const isProduction = this.configService.get<string>('NODE_ENV') === 'production';
    const cookieDomain = this.configService.get<string>('COOKIE_DOMAIN') || undefined;
    const cookieBase = {
      httpOnly: true,
      secure: isProduction,
      sameSite: 'strict' as const,
      domain: cookieDomain,
      path: '/',
    };

    res.cookie(ACCESS_COOKIE, accessToken, { ...cookieBase, maxAge: 15 * 60 * 1000 });
    res.cookie(REFRESH_COOKIE, refreshToken, { ...cookieBase, maxAge: REFRESH_TTL_MS });

    // Return the new access token so the frontend can update its store and retry the request
    return res.json({ ok: true, accessToken });
  }

  /**
   * F24: Logout — revokes the refresh token in Redis and clears both cookies.
   */
  @Post('logout')
  async logout(@Req() req: Request, @Res() res: Response) {
    const token = (req as any).cookies?.[REFRESH_COOKIE];
    if (token) {
      await this.authService.revokeRefreshToken(token);
    }
    res.clearCookie(ACCESS_COOKIE, { path: '/' });
    res.clearCookie(REFRESH_COOKIE, { path: '/' });
    return res.json({ ok: true });
  }
}
