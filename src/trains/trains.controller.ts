import { Controller, Get, Post, Body, Param, Delete, Render, Res, Req, Query } from '@nestjs/common';
import type { Request, Response } from 'express';
import { TrainsService } from './trains.service';
import { CreateTrainDto } from './dto/create-train.dto';

@Controller('trains')
export class TrainsController {
  constructor(private readonly trainsService: TrainsService) {}

  @Post()
  async create(@Body() createTrainDto: CreateTrainDto, @Res() res: Response) {
    try {
      await this.trainsService.create(createTrainDto);
      return res.redirect('/trains?message=Train created successfully&messageType=success');
    } catch (error: any) {
      return res.redirect(`/trains?message=${encodeURIComponent(error.message)}&messageType=danger`);
    }
  }

  @Get()
  @Render('trains/index')
  async findAll(
    @Req() req: Request,
    @Query('message') message?: string,
    @Query('messageType') messageType?: string,
  ) {
    const session = (req as any).session;
    const trains = await this.trainsService.findAll();
    return {
      title: 'Trains Management',
      trains,
      isLoggedIn: session?.isLoggedIn || false,
      username: session?.username || 'Guest',
      userRole: session?.role || '',
      message,
      messageType,
      activePage: { trains: true },
    };
  }

  @Get(':id')
  @Render('trains/detail')
  async findOne(@Param('id') id: string | number, @Req() req: Request) {
    const session = (req as any).session;
    const train = await this.trainsService.findOne(Number(id));
    return {
      title: train ? `Train: ${train.name}` : 'Train Not Found',
      train,
      isLoggedIn: session?.isLoggedIn || false,
      username: session?.username || 'Guest',
      userRole: session?.role || '',
      activePage: { trains: true },
    };
  }

  @Delete(':id')
  async remove(@Param('id') id: string, @Res() res: Response) {
    try {
      await this.trainsService.remove(id);
      return res.json({ success: true, message: 'Train deleted successfully' });
    } catch (error: any) {
      return res.status(400).json({ success: false, message: error.message });
    }
  }
}
