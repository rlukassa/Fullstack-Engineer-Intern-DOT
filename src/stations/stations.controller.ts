import { Controller, Get, Post, Body, Param, Delete, Render, Res, Req, Query } from '@nestjs/common';
import type { Request, Response } from 'express';
import { StationsService } from './stations.service';
import { CreateStationDto } from './dto/create-station.dto';

@Controller('stations')
export class StationsController {
  constructor(private readonly stationsService: StationsService) {}

  @Post()
  async create(@Body() createStationDto: CreateStationDto, @Res() res: Response) {
    try {
      await this.stationsService.create(createStationDto);
      return res.redirect('/stations?message=Station created successfully&messageType=success');
    } catch (error: any) {
      return res.redirect(`/stations?message=${encodeURIComponent(error.message)}&messageType=danger`);
    }
  }

  @Get()
  @Render('stations/index')
  async findAll(
    @Req() req: Request,
    @Query('message') message?: string,
    @Query('messageType') messageType?: string,
  ) {
    const session = (req as any).session;
    const stations = await this.stationsService.findAll();
    return {
      title: 'Stations Management',
      stations,
      isLoggedIn: session?.isLoggedIn || false,
      username: session?.username || 'Guest',
      userRole: session?.role || '',
      message,
      messageType,
      activePage: { stations: true },
    };
  }

  @Get(':id')
  @Render('stations/detail')
  async findOne(@Param('id') id: number, @Req() req: Request) {
    const session = (req as any).session;
    const station = await this.stationsService.findOne(id);
    return {
      title: station ? `Station: ${station.name}` : 'Station Not Found',
      station,
      isLoggedIn: session?.isLoggedIn || false,
      username: session?.username || 'Guest',
      userRole: session?.role || '',
      activePage: { stations: true },
    };
  }

  @Delete(':id')
  async remove(@Param('id') id: number, @Res() res: Response) {
    try {
      await this.stationsService.remove(id);
      return res.json({ success: true, message: 'Station deleted successfully' });
    } catch (error: any) {
      return res.status(400).json({ success: false, message: error.message });
    }
  }
}
