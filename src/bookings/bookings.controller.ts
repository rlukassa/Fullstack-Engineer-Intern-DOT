import { Controller, Get, Post, Body, Param, Delete, Render, Req, Res, Query } from '@nestjs/common';
import type { Request, Response } from 'express';
import { BookingsService } from './bookings.service';
import { CreateBookingDto } from './dto/create-booking.dto';

@Controller('bookings')
export class BookingsController {
  constructor(private readonly bookingsService: BookingsService) {}

  @Post()
  async create(@Body() createBookingDto: CreateBookingDto, @Req() req: Request, @Res() res: Response) {
    const session = (req as any).session;
    
    if (!session?.isLoggedIn) {
      return res.redirect('/auth/login?message=Please login to make a booking&messageType=warning');
    }
    
    try {
      // Set userId from session
      createBookingDto.userId = session.userId;
      await this.bookingsService.create(createBookingDto);
      return res.redirect('/bookings?message=Booking created successfully!&messageType=success');
    } catch (error: any) {
      return res.redirect(`/bookings?message=${encodeURIComponent(error.message)}&messageType=danger`);
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
      message,
      messageType,
      activePage: { bookings: true },
    };
  }

  @Get(':id')
  @Render('bookings/detail')
  async findOne(@Param('id') id: number, @Req() req: Request) {
    const session = (req as any).session;
    const booking = await this.bookingsService.findOne(id);
    return {
      title: booking ? `Booking #${booking.id}` : 'Booking Not Found',
      booking,
      isLoggedIn: session?.isLoggedIn || false,
      username: session?.username || 'Guest',
      userRole: session?.role || '',
      activePage: { bookings: true },
    };
  }

  @Delete(':id')
  async remove(@Param('id') id: number, @Res() res: Response) {
    try {
      await this.bookingsService.remove(id);
      return res.json({ success: true, message: 'Booking cancelled successfully' });
    } catch (error: any) {
      return res.status(400).json({ success: false, message: error.message });
    }
  }
}
