import { Controller, Get, Render, Req, Query } from '@nestjs/common';
import type { Request } from 'express';
import { AppService } from './app.service';
import { TrainsService } from './trains/trains.service';
import { SchedulesService } from './schedules/schedules.service';
import { StationsService } from './stations/stations.service';
import { BookingsService } from './bookings/bookings.service';

@Controller()
export class AppController {
  constructor(
    private readonly appService: AppService,
    private readonly trainsService: TrainsService,
    private readonly schedulesService: SchedulesService,
    private readonly stationsService: StationsService,
    private readonly bookingsService: BookingsService,
  ) {}

  @Get()
  @Render('index')
  async getHome(
    @Req() req: Request,
    @Query('message') message?: string,
    @Query('messageType') messageType?: string,
  ) {
    const session = (req as any).session;
    
    // Fetch data for dashboard
    const trains = await this.trainsService.findAll();
    const schedules = await this.schedulesService.findAll();
    const stations = await this.stationsService.findAll();
    const bookings = await this.bookingsService.findAll();
    
    // Get recent items (last 5)
    const recentTrains = trains.slice(0, 5);
    const recentSchedules = schedules.slice(0, 5);
    
    return {
      title: 'Dashboard',
      isLoggedIn: session?.isLoggedIn || false,
      username: session?.username || 'Guest',
      userRole: session?.role || '',
      balance: session?.balance || 0,
      message,
      messageType,
      activePage: { home: true },
      // Stats
      trainsCount: trains.length,
      schedulesCount: schedules.length,
      stationsCount: stations.length,
      bookingsCount: bookings.length,
      // Recent data
      recentTrains,
      recentSchedules,
    };
  }
}
