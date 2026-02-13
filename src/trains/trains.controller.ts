import { Controller, Get, Post, Body, Param, Delete, Render, Res, Req, Query } from '@nestjs/common';
import type { Request, Response } from 'express';
import { TrainsService } from './trains.service';
import { CreateTrainDto } from './dto/create-train.dto';
import { BookingsService } from '../bookings/bookings.service';

@Controller('trains')
export class TrainsController {
  constructor(
    private readonly trainsService: TrainsService,
    private readonly bookingsService: BookingsService,
  ) {}

  @Post()
  async create(@Body() body: any, @Res() res: Response) {
    try {
      const createTrainDto: CreateTrainDto = {
        name: body.name,
        type: body.type,
        totalSeats: parseInt(body.totalSeats, 10) || 0,
      };
      await this.trainsService.create(createTrainDto);
      return res.redirect('/trains?message=Kereta berhasil dibuat&messageType=success');
    } catch (error: any) {
      return res.redirect(`/trains?message=${encodeURIComponent(error.message)}&messageType=danger`);
    }
  }

  @Get()
  @Render('trains/index')
  async findAll(
    @Req() req: Request,
    @Query('search') search?: string,
    @Query('message') message?: string,
    @Query('messageType') messageType?: string,
  ) {
    const session = (req as any).session;
    const trains = await this.trainsService.findAll(search);
    return {
      title: 'Trains Management',
      trains,
      search,
      isLoggedIn: session?.isLoggedIn || false,
      username: session?.username || 'Guest',
      userRole: session?.role || '',
      balance: session?.balance || 0,
      message,
      messageType,
      activePage: { trains: true },
    };
  }

  @Get(':id')
  @Render('trains/detail')
  async findOne(
    @Param('id') id: string | number, 
    @Req() req: Request,
    @Query('message') message?: string,
    @Query('messageType') messageType?: string,
  ) {
    const session = (req as any).session;
    const train = await this.trainsService.findOne(Number(id));
    return {
      title: train ? `Kereta: ${train.name}` : 'Kereta Tidak Ditemukan',
      train,
      isLoggedIn: session?.isLoggedIn || false,
      username: session?.username || 'Guest',
      userRole: session?.role || '',
      balance: session?.balance || 0,
      message,
      messageType,
      activePage: { trains: true },
    };
  }

  @Post(':id/update')
  async updateTrain(
    @Param('id') id: string,
    @Body() body: any,
    @Req() req: Request,
    @Res() res: Response,
  ) {
    const session = (req as any).session;

    if (session?.role !== 'ADMIN') {
      return res.redirect('/trains?message=Tidak memiliki akses&messageType=danger');
    }

    try {
      // Refund all confirmed bookings for this train
      const refundResult = await this.bookingsService.refundBookingsForTrain(
        Number(id),
        'Admin telah memperbarui data kereta. Dana Anda telah dikembalikan.'
      );

      // Update the train
      const updateData: any = {};
      if (body.name) updateData.name = body.name;
      if (body.type) updateData.type = body.type;
      if (body.totalSeats) updateData.totalSeats = parseInt(body.totalSeats, 10);

      await this.trainsService.update(id, updateData);

      let message = 'Kereta berhasil diperbarui';
      if (refundResult.refunded > 0) {
        message += `. ${refundResult.refunded} pemesanan di-refund (Total: Rp ${refundResult.totalRefundAmount.toLocaleString('id-ID')})`;
      }

      return res.redirect(`/trains/${id}?message=${encodeURIComponent(message)}&messageType=success`);
    } catch (error: any) {
      return res.redirect(`/trains/${id}?message=${encodeURIComponent(error.message)}&messageType=danger`);
    }
  }

  @Delete(':id')
  async remove(@Param('id') id: string, @Req() req: Request, @Res() res: Response) {
    const session = (req as any).session;

    if (session?.role !== 'ADMIN') {
      return res.status(403).json({ success: false, message: 'Tidak memiliki akses' });
    }

    try {
      // Refund all confirmed bookings first before deleting
      await this.bookingsService.refundBookingsForTrain(
        Number(id),
        'Admin telah menghapus kereta. Dana Anda telah dikembalikan.'
      );
      
      await this.trainsService.remove(id);
      return res.json({ success: true, message: 'Kereta berhasil dihapus' });
    } catch (error: any) {
      return res.status(400).json({ success: false, message: error.message });
    }
  }
}
