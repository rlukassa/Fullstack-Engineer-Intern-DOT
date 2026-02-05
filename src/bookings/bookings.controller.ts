import { Controller, Get, Post, Body, Param, Delete, Render, Req, Res, Query, Patch } from '@nestjs/common';
import type { Request, Response } from 'express';
import { BookingsService } from './bookings.service';
import { CreateBookingDto } from './dto/create-booking.dto';
import { SchedulesService } from '../schedules/schedules.service';
import { BookingStatus } from './entities/booking.entity';

@Controller('bookings')
export class BookingsController {
  constructor(
    private readonly bookingsService: BookingsService,
  ) {}

  @Post()
  async create(@Body() body: any, @Req() req: Request, @Res() res: Response) {
    const session = (req as any).session;
    
    if (!session?.isLoggedIn || !session?.userId) {
      return res.redirect('/auth/login?error=Silakan masuk untuk membuat pemesanan');
    }
    
    try {
      const createBookingDto: CreateBookingDto = {
        userId: session.userId,
        scheduleId: parseInt(body.scheduleId, 10),
        seatCount: parseInt(body.seatCount, 10) || 1,
        bookingCode: '',
      };

      await this.bookingsService.create(createBookingDto);
      return res.redirect('/bookings?message=Pemesanan berhasil dibuat! Silakan lakukan pembayaran.&messageType=success');
    } catch (error: any) {
      return res.redirect(`/schedules?message=${encodeURIComponent(error.message || 'Gagal membuat pemesanan')}&messageType=danger`);
    }
  }

  @Post(':id/pay')
  async payBooking(@Param('id') id: number, @Req() req: Request, @Res() res: Response) {
    const session = (req as any).session;

    if (!session?.isLoggedIn || !session?.userId) {
      return res.redirect('/auth/login?error=Silakan masuk untuk melakukan pembayaran');
    }

    try {
      const result = await this.bookingsService.payBooking(id, session.userId);

      if (!result.success) {
        return res.redirect(`/bookings/${id}?message=${encodeURIComponent(result.error || 'Pembayaran gagal')}&messageType=danger`);
      }

      // Update session balance
      const booking = result.booking;
      if (booking) {
        const user = booking.user;
        if (user) {
          session.balance = Number(user.balance) || 0;
        }
      }

      return res.redirect(`/bookings/${id}?message=Pembayaran berhasil! Tiket Anda sudah terkonfirmasi.&messageType=success`);
    } catch (error: any) {
      return res.redirect(`/bookings/${id}?message=${encodeURIComponent(error.message || 'Pembayaran gagal')}&messageType=danger`);
    }
  }

  @Post(':id/cancel')
  async cancelBooking(@Param('id') id: number, @Req() req: Request, @Res() res: Response) {
    const session = (req as any).session;

    if (!session?.isLoggedIn || !session?.userId) {
      return res.redirect('/auth/login?error=Silakan masuk untuk membatalkan pemesanan');
    }

    try {
      const isAdmin = session.role === 'ADMIN';
      const result = await this.bookingsService.cancelBooking(id, session.userId, isAdmin);

      if (!result.success) {
        return res.redirect(`/bookings/${id}?message=${encodeURIComponent(result.error || 'Pembatalan gagal')}&messageType=danger`);
      }

      let message = 'Pemesanan berhasil dibatalkan.';
      if (result.refundAmount && result.refundAmount > 0) {
        message += ` Refund sebesar Rp ${result.refundAmount.toLocaleString('id-ID')} telah dikembalikan ke saldo Anda.`;
        // Update session balance
        const balance = await this.bookingsService['usersRepository'].findOne({ where: { id: session.userId } });
        if (balance) {
          session.balance = Number(balance.balance) || 0;
        }
      }

      return res.redirect(`/bookings?message=${encodeURIComponent(message)}&messageType=success`);
    } catch (error: any) {
      return res.redirect(`/bookings/${id}?message=${encodeURIComponent(error.message || 'Pembatalan gagal')}&messageType=danger`);
    }
  }

  // Admin endpoint to update booking status
  @Patch(':id/status')
  async updateStatus(
    @Param('id') id: number,
    @Body() body: { status: BookingStatus },
    @Req() req: Request,
    @Res() res: Response
  ) {
    const session = (req as any).session;

    if (session?.role !== 'ADMIN') {
      return res.status(403).json({ success: false, message: 'Tidak memiliki akses' });
    }

    try {
      const booking = await this.bookingsService.updateStatus(id, body.status);
      return res.json({ success: true, booking });
    } catch (error: any) {
      return res.status(400).json({ success: false, message: error.message });
    }
  }

  @Get()
  @Render('bookings/index')
  async findAll(
    @Req() req: Request,
    @Query('message') message?: string,
    @Query('messageType') messageType?: string,
  ) {
    const session = (req as any).session;
    let bookings;
    
    // Admin sees all bookings, users see only their own
    if (session?.role === 'ADMIN') {
      bookings = await this.bookingsService.findAll();
    } else if (session?.userId) {
      bookings = await this.bookingsService.findByUser(session.userId);
    } else {
      bookings = [];
    }
    
    return {
      title: 'My Bookings',
      bookings,
      isLoggedIn: session?.isLoggedIn || false,
      username: session?.username || 'Guest',
      userRole: session?.role || '',
      balance: session?.balance || 0,
      message,
      messageType,
      activePage: { bookings: true },
    };
  }

  @Get(':id')
  @Render('bookings/detail')
  async findOne(
    @Param('id') id: number,
    @Req() req: Request,
    @Query('message') message?: string,
    @Query('messageType') messageType?: string,
  ) {
    const session = (req as any).session;
    const booking = await this.bookingsService.findOne(id);
    return {
      title: booking ? `Pemesanan #${booking.id}` : 'Pemesanan Tidak Ditemukan',
      booking,
      isLoggedIn: session?.isLoggedIn || false,
      username: session?.username || 'Guest',
      userRole: session?.role || '',
      balance: session?.balance || 0,
      message,
      messageType,
      activePage: { bookings: true },
    };
  }

  @Delete(':id')
  async remove(@Param('id') id: number, @Req() req: Request, @Res() res: Response) {
    const session = (req as any).session;
    
    try {
      const isAdmin = session?.role === 'ADMIN';
      const result = await this.bookingsService.cancelBooking(id, session?.userId, isAdmin);

      if (!result.success) {
        return res.status(400).json({ success: false, message: result.error });
      }

      return res.json({ success: true, message: 'Pemesanan berhasil dibatalkan', refundAmount: result.refundAmount });
    } catch (error: any) {
      return res.status(400).json({ success: false, message: error.message });
    }
  }
}
