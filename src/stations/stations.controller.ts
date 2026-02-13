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
      return res.redirect('/stations?message=Stasiun berhasil dibuat&messageType=success');
    } catch (error: any) {
      return res.redirect(`/stations?message=${encodeURIComponent(error.message)}&messageType=danger`);
    }
  }

  @Get()
  @Render('stations/index')
  async findAll(
    @Req() req: Request,
    @Query('search') search?: string,
    @Query('message') message?: string,
    @Query('messageType') messageType?: string,
  ) {
    const session = (req as any).session;
    const stations = await this.stationsService.findAll(search);
    return {
      title: 'Stations Management',
      stations,
      search,
      isLoggedIn: session?.isLoggedIn || false,
      username: session?.username || 'Guest',
      userRole: session?.role || '',
      balance: session?.balance || 0,
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
      title: station ? `Stasiun: ${station.name}` : 'Stasiun Tidak Ditemukan',
      station,
      isLoggedIn: session?.isLoggedIn || false,
      username: session?.username || 'Guest',
      userRole: session?.role || '',
      balance: session?.balance || 0,
      activePage: { stations: true },
    };
  }

  @Post(':id/update')
  async updateStation(@Param('id') id: number, @Body() body: any, @Req() req: Request, @Res() res: Response) {
    const session = (req as any).session;

    if (session?.role !== 'ADMIN') {
      return res.redirect('/stations?message=Tidak memiliki akses&messageType=danger');
    }

    try {
      const updateData: any = {};
      if (body.name) updateData.name = body.name;
      if (body.code) updateData.code = body.code;
      if (body.city) updateData.city = body.city;
      if (body.address) updateData.address = body.address;

      await this.stationsService.update(Number(id), updateData);
      return res.redirect(`/stations/${id}?message=Stasiun berhasil diperbarui&messageType=success`);
    } catch (error: any) {
      return res.redirect(`/stations/${id}?message=${encodeURIComponent(error.message)}&messageType=danger`);
    }
  }

  @Delete(':id')
  async remove(@Param('id') id: number, @Res() res: Response) {
    try {
      await this.stationsService.remove(id);
      return res.json({ success: true, message: 'Stasiun berhasil dihapus' });
    } catch (error: any) {
      return res.status(400).json({ success: false, message: error.message });
    }
  }
}
