import { Controller, Post, Body, Get, Render, Res, Req, Session } from '@nestjs/common';
import type { Response, Request } from 'express';
import { AuthService } from './auth.service';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Get('login')
  @Render('auth/login')
  loginPage(@Req() req: Request) {
    return { 
      title: 'Login',
      error: (req as any).query?.error,
      success: (req as any).query?.success,
    };
  }

  @Get('register')
  @Render('auth/register')
  registerPage(@Req() req: Request) {
    return { 
      title: 'Register',
      error: (req as any).query?.error,
    };
  }

  @Post('register')
  async register(
    @Body() body: { username: string; email: string; password: string; confirmPassword: string },
    @Res() res: Response,
  ) {
    try {
      // Validate passwords match
      if (body.password !== body.confirmPassword) {
        return res.redirect('/auth/register?error=Passwords do not match');
      }

      await this.authService.register({
        username: body.username,
        email: body.email,
        password: body.password,
      });

      return res.redirect('/auth/login?success=Registration successful! Please login.');
    } catch (error: any) {
      return res.redirect(`/auth/register?error=${encodeURIComponent(error.message || 'Registration failed')}`);
    }
  }

  @Post('login')
  async login(
    @Body() body: { email: string; password: string; loginType: string },
    @Session() session: Record<string, any>,
    @Res() res: Response,
  ) {
    try {
      const result = await this.authService.login(body.email, body.password);

      if (!result.success) {
        return res.redirect(`/auth/login?error=${encodeURIComponent(result.error || 'Login failed')}`);
      }

      // Check if login type matches user role
      if (body.loginType === 'admin' && result.user.role !== 'ADMIN') {
        return res.redirect('/auth/login?error=You are not authorized as admin');
      }

      // Set session
      session.user_id = result.user.id;
      session.username = result.user.username;
      session.email = result.user.email;
      session.role = result.user.role;
      session.isLoggedIn = true;

      return res.redirect('/?message=Login successful&messageType=success');
    } catch (error: any) {
      return res.redirect(`/auth/login?error=${encodeURIComponent(error.message || 'Login failed')}`);
    }
  }

  @Get('logout')
  logout(@Session() session: Record<string, any>, @Res() res: Response) {
    session.user_id = null;
    session.username = null;
    session.email = null;
    session.role = null;
    session.isLoggedIn = false;
    
    return res.redirect('/?message=You have been logged out&messageType=info');
  }

  @Get()
  @Render('auth/login')
  async index() {
    return { title: 'Authentication' };
  }
}
