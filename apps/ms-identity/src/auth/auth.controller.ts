import { Controller, Get, UseGuards, Req, Res, Logger, HttpStatus } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ConfigService } from '@nestjs/config';
import { AuthService } from './auth.service';
import { Response, Request } from 'express';

@Controller('auth')
export class AuthController {
  private readonly logger = new Logger(AuthController.name);

  constructor(
    private readonly authService: AuthService,
    private readonly configService: ConfigService,
  ) {}

  @Get('google')
  @UseGuards(AuthGuard('google'))
  async googleAuth(@Req() req: Request) {}

  @Get('google/callback')
  @UseGuards(AuthGuard('google'))
  async googleAuthRedirect(@Req() req: Request, @Res() res: Response) {
    try {
      this.logger.log('Starting Google Auth Callback');
      const { accessToken } = await this.authService.validateOAuthUser(req.user);
      this.logger.log('Access token generated successfully');

      const isProduction = this.configService.get<string>('NODE_ENV') === 'production';
      const cookieDomain = this.configService.get<string>('COOKIE_DOMAIN') || undefined;
      const frontendUrl = this.configService.get<string>('FRONTEND_URL') || 'http://localhost:5173';

      // F3: deliver token via HttpOnly cookie — NOT in the URL
      res.cookie('auth_token', accessToken, {
        httpOnly: true,
        secure: isProduction,
        sameSite: 'strict',
        domain: cookieDomain,
        maxAge: 24 * 60 * 60 * 1000, // 1 day, matches JWT expiry
        path: '/',
      });

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
   * The cookie is read server-side and returned in the response body so the
   * frontend SPA can store it for Bearer-based API calls to downstream services.
   */
  @Get('token')
  @UseGuards(AuthGuard('jwt'))
  getToken(@Req() req: any, @Res() res: Response) {
    const accessToken = req.cookies?.auth_token;
    return res.json({
      accessToken,
      user: req.user,
    });
  }
}
