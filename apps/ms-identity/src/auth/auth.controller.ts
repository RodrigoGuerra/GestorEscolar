import { Controller, Get, UseGuards, Req, Res } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { AuthService } from './auth.service';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Get('google')
  @UseGuards(AuthGuard('google'))
  async googleAuth(@Req() req) {}

  @Get('google/callback')
  @UseGuards(AuthGuard('google'))
  async googleAuthRedirect(@Req() req, @Res() res) {
    try {
      console.log('[AuthController] Starting Google Auth Callback');
      const { accessToken } = await this.authService.validateOAuthUser(req.user);
      console.log('[AuthController] Access token generated successfully');
      return res.redirect(`http://localhost:5173/login/success?token=${accessToken}`);
    } catch (error) {
      console.error('[AuthController] Error in Google Auth Callback:', error);
      return res.status(500).json({
        message: 'Internal Server Error during Google Auth Callback',
        error: error.message,
        stack: error.stack
      });
    }
  }

  @Get('profile')
  @UseGuards(AuthGuard('jwt'))
  getProfile(@Req() req) {
    return req.user;
  }
}
