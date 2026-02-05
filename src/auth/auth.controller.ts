import { Controller, Post, Body, Get, Render, Res, Req, Query } from '@nestjs/common';
import type { Response, Request } from 'express';
import { AuthService } from './auth.service';

// Helper to promisify session.save
const saveSession = (session: any): Promise<void> => {
  return new Promise((resolve, reject) => {
    session.save((err: any) => {
      if (err) reject(err);
      else resolve();
    });
  });
};

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Get('login')
  @Render('auth/login')
  loginPage(@Query('error') error?: string, @Query('success') success?: string) {
    return { 
      title: 'Login',
      error,
      success,
    };
  }

  @Get('register')
  @Render('auth/register')
  registerPage(@Query('error') error?: string) {
    return { 
      title: 'Register',
      error,
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
        return res.redirect('/auth/register?error=Password tidak sesuai');
      }

      await this.authService.register({
        username: body.username,
        email: body.email,
        password: body.password,
      });

      return res.redirect('/auth/login?success=Registrasi berhasil! Silakan masuk.');
    } catch (error: any) {
      return res.redirect(`/auth/register?error=${encodeURIComponent(error.message || 'Registrasi gagal')}`);
    }
  }

  @Post('login')
  async login(
    @Body() body: { email: string; password: string; loginType: string },
    @Req() req: Request,
    @Res() res: Response,
  ) {
    try {
      const session = (req as any).session;
      const result = await this.authService.login(body.email, body.password);

      if (!result.success) {
        return res.redirect(`/auth/login?error=${encodeURIComponent(result.error || 'Login gagal')}`);
      }

      // Check if login type matches user role
      if (body.loginType === 'admin' && result.user.role !== 'ADMIN') {
        return res.redirect('/auth/login?error=Anda tidak berwenang sebagai admin');
      }

      // Set session data
      session.user_id = result.user.id;
      session.userId = result.user.id;
      session.username = result.user.username;
      session.email = result.user.email;
      session.role = result.user.role;
      session.balance = Number(result.user.balance) || 0;
      session.isLoggedIn = true;

      // Save session and redirect
      try {
        await saveSession(session);
        return res.redirect('/?message=Login berhasil&messageType=success');
      } catch (saveErr) {
        return res.redirect('/auth/login?error=Gagal menyimpan session');
      }
    } catch (error: any) {
      return res.redirect(`/auth/login?error=${encodeURIComponent(error.message || 'Login gagal')}`);
    }
  }

  @Post('topup')
  async topUp(
    @Body() body: { amount: string },
    @Req() req: Request,
    @Res() res: Response,
  ) {
    const session = (req as any).session;

    try {
      const userId = session?.userId || session?.user_id;
      
      if (!session?.isLoggedIn || !userId) {
        return res.redirect('/auth/login?error=Silakan login terlebih dahulu');
      }

      const amount = parseInt(body.amount, 10);

      if (isNaN(amount) || amount <= 0) {
        return res.redirect('/?message=Jumlah top up tidak valid&messageType=danger');
      }

      const result = await this.authService.topUp(userId, amount);

      if (!result.success) {
        return res.redirect(`/?message=${encodeURIComponent(result.error || 'Top up gagal')}&messageType=danger`);
      }

      // Update session balance
      session.balance = Number(result.balance) || 0;

      // Save session and redirect
      try {
        await saveSession(session);
        return res.redirect(`/?message=Top up berhasil! Saldo Anda sekarang Rp ${result.balance?.toLocaleString('id-ID')}&messageType=success`);
      } catch (saveErr) {
        return res.redirect('/?message=Top up berhasil tetapi gagal update session&messageType=warning');
      }
    } catch (error: any) {
      return res.redirect(`/?message=${encodeURIComponent(error.message || 'Top up gagal')}&messageType=danger`);
    }
  }

  @Get('balance')
  async getBalance(@Req() req: Request, @Res() res: Response) {
    try {
      const session = (req as any).session;
      const userId = session?.userId || session?.user_id;
      
      if (!session?.isLoggedIn || !userId) {
        return res.json({ success: false, error: 'Not logged in' });
      }

      const balance = await this.authService.getBalance(userId);
      session.balance = Number(balance) || 0;

      return res.json({ success: true, balance });
    } catch (error: any) {
      return res.json({ success: false, error: error.message });
    }
  }

  @Get('logout')
  logout(@Req() req: Request, @Res() res: Response) {
    const session = (req as any).session;
    session.destroy((err: any) => {
      if (err) {
      }
      res.clearCookie('sobatkereta.sid');
      return res.redirect('/?message=Anda telah keluar&messageType=info');
    });
  }

  @Get()
  @Render('auth/login')
  async index() {
    return { title: 'Authentication' };
  }
}
