import { Controller, Get, Post, Body, Param, Delete, Render, Res, Req, Query, Patch, Put } from '@nestjs/common';
import type { Request, Response } from 'express';
import { SchedulesService } from './schedules.service';
import { CreateScheduleDto } from './dto/create-schedule.dto';
import { JourneyStatus } from './entities/schedule.entity';
import { TrainsService } from '../trains/trains.service';
import { StationsService } from '../stations/stations.service';
import { BookingsService } from '../bookings/bookings.service';

@Controller('schedules')
export class SchedulesController {
  constructor(
    private readonly schedulesService: SchedulesService,
    private readonly trainsService: TrainsService,
    private readonly stationsService: StationsService,
    private readonly bookingsService: BookingsService,
  ) {}

  @Post()
  async create(@Body() body: any, @Res() res: Response) {
    try {
      const createScheduleDto: CreateScheduleDto = {
        trainId: parseInt(body.trainId, 10),
        originStationId: parseInt(body.originStationId, 10),
        destinationStationId: parseInt(body.destinationStationId, 10),
        departureTime: new Date(body.departureTime),
        arrivalTime: new Date(body.arrivalTime),
        price: parseInt(body.price, 10),
      };

      await this.schedulesService.create(createScheduleDto);
      return res.redirect('/schedules?message=Jadwal berhasil dibuat&messageType=success');
    } catch (error: any) {
      return res.redirect(`/schedules?message=${encodeURIComponent(error.message)}&messageType=danger`);
    }
  }

  @Post(':id/status')
  async updateJourneyStatus(
    @Param('id') id: number,
    @Body() body: { status: JourneyStatus },
    @Req() req: Request,
    @Res() res: Response,
  ) {
    const session = (req as any).session;

    if (session?.role !== 'ADMIN') {
      return res.redirect('/schedules?message=Tidak memiliki akses&messageType=danger');
    }

    try {
      await this.schedulesService.updateJourneyStatus(id, body.status);
      return res.redirect(`/schedules/${id}?message=Status perjalanan berhasil diubah&messageType=success`);
    } catch (error: any) {
      return res.redirect(`/schedules/${id}?message=${encodeURIComponent(error.message)}&messageType=danger`);
    }
  }

  @Patch(':id/status')
  async updateJourneyStatusApi(
    @Param('id') id: number,
    @Body() body: { status: JourneyStatus },
    @Req() req: Request,
    @Res() res: Response,
  ) {
    const session = (req as any).session;

    if (session?.role !== 'ADMIN') {
      return res.status(403).json({ success: false, message: 'Tidak memiliki akses' });
    }

    try {
      const schedule = await this.schedulesService.updateJourneyStatus(id, body.status);
      return res.json({ success: true, schedule });
    } catch (error: any) {
      return res.status(400).json({ success: false, message: error.message });
    }
  }

  @Post('update-all-statuses')
  async updateAllStatuses(@Req() req: Request, @Res() res: Response) {
    const session = (req as any).session;

    if (session?.role !== 'ADMIN') {
      return res.status(403).json({ success: false, message: 'Tidak memiliki akses' });
    }

    try {
      const result = await this.schedulesService.updateAllJourneyStatuses();
      return res.json({ success: true, ...result });
    } catch (error: any) {
      return res.status(400).json({ success: false, message: error.message });
    }
  }

  @Get()
  @Render('schedules/index')
  async findAll(
    @Req() req: Request,
    @Query('message') message?: string,
    @Query('messageType') messageType?: string,
    @Query('search') search?: string,
  ) {
    const session = (req as any).session;
    let schedules;
    
    // Auto update journey statuses
    await this.schedulesService.updateAllJourneyStatuses();
    
    if (search) {
      schedules = await this.schedulesService.search(search);
    } else {
      schedules = await this.schedulesService.findAll();
    }

    // Get trains and stations for admin form
    const trains = await this.trainsService.findAll();
    const stations = await this.stationsService.findAll();
    
    return {
      title: 'Schedules Management',
      schedules,
      trains,
      stations,
      search,
      isLoggedIn: session?.isLoggedIn || false,
      username: session?.username || 'Guest',
      userRole: session?.role || '',
      balance: session?.balance || 0,
      message,
      messageType,
      activePage: { schedules: true },
    };
  }

  @Get(':id')
  @Render('schedules/detail')
  async findOne(
    @Param('id') id: string | number,
    @Req() req: Request,
    @Query('message') message?: string,
    @Query('messageType') messageType?: string,
  ) {
    const session = (req as any).session;
    
    // Auto update journey statuses
    await this.schedulesService.updateAllJourneyStatuses();
    
    const schedule = await this.schedulesService.findOne(Number(id));
    
    // Get seat availability
    const seatInfo = schedule ? await this.bookingsService.getAvailableSeats(Number(id)) : null;
    
    // Check if user has an active booking for this schedule
    let userActiveBooking: any = null;
    if (session?.userId && schedule) {
      userActiveBooking = await this.bookingsService.findActiveBookingByUserAndSchedule(session.userId, Number(id));
    }
    
    // Get trains and stations for admin edit form
    const trains = await this.trainsService.findAll();
    const stations = await this.stationsService.findAll();
    
    return {
      title: schedule ? `Jadwal #${schedule.id}` : 'Jadwal Tidak Ditemukan',
      schedule,
      seatInfo,
      userActiveBooking,
      trains,
      stations,
      isLoggedIn: session?.isLoggedIn || false,
      username: session?.username || 'Guest',
      userRole: session?.role || '',
      balance: session?.balance || 0,
      message,
      messageType,
      activePage: { schedules: true },
    };
  }

  @Post(':id/update')
  async updateSchedule(
    @Param('id') id: string,
    @Body() body: any,
    @Req() req: Request,
    @Res() res: Response,
  ) {
    const session = (req as any).session;

    if (session?.role !== 'ADMIN') {
      return res.redirect('/schedules?message=Tidak memiliki akses&messageType=danger');
    }

    try {
      // Refund all confirmed bookings first
      const refundResult = await this.bookingsService.refundBookingsForSchedule(
        Number(id), 
        'Admin telah memperbarui jadwal kereta. Dana Anda telah dikembalikan.'
      );

      // Update the schedule
      const updateData: any = {};
      if (body.trainId) updateData.trainId = parseInt(body.trainId, 10);
      if (body.originStationId) updateData.originStationId = parseInt(body.originStationId, 10);
      if (body.destinationStationId) updateData.destinationStationId = parseInt(body.destinationStationId, 10);
      if (body.departureTime) updateData.departureTime = new Date(body.departureTime);
      if (body.arrivalTime) updateData.arrivalTime = new Date(body.arrivalTime);
      if (body.price) updateData.price = parseInt(body.price, 10);

      await this.schedulesService.update(id, updateData);

      let message = 'Jadwal berhasil diperbarui';
      if (refundResult.refunded > 0) {
        message += `. ${refundResult.refunded} pemesanan di-refund (Total: Rp ${refundResult.totalRefundAmount.toLocaleString('id-ID')})`;
      }

      return res.redirect(`/schedules/${id}?message=${encodeURIComponent(message)}&messageType=success`);
    } catch (error: any) {
      return res.redirect(`/schedules/${id}?message=${encodeURIComponent(error.message)}&messageType=danger`);
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
      await this.bookingsService.refundBookingsForSchedule(
        Number(id),
        'Admin telah menghapus jadwal kereta. Dana Anda telah dikembalikan.'
      );
      
      await this.schedulesService.remove(id);
      return res.json({ success: true, message: 'Jadwal berhasil dihapus' });
    } catch (error: any) {
      return res.status(400).json({ success: false, message: error.message });
    }
  }
}
