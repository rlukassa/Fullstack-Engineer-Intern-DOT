import { Controller, Get, Post, Body, Param, Delete, Render, Res, Req, Query } from '@nestjs/common';
import type { Request, Response } from 'express';
import { SchedulesService } from './schedules.service';
import { CreateScheduleDto } from './dto/create-schedule.dto';

@Controller('schedules')
export class SchedulesController {
  constructor(private readonly schedulesService: SchedulesService) {}

  @Post()
  async create(@Body() createScheduleDto: CreateScheduleDto, @Res() res: Response) {
    try {
      await this.schedulesService.create(createScheduleDto);
      return res.redirect('/schedules?message=Schedule created successfully&messageType=success');
    } catch (error: any) {
      return res.redirect(`/schedules?message=${encodeURIComponent(error.message)}&messageType=danger`);
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
    
    if (search) {
      schedules = await this.schedulesService.search(search);
    } else {
      schedules = await this.schedulesService.findAll();
    }
    
    return {
      title: 'Schedules Management',
      schedules,
      search,
      isLoggedIn: session?.isLoggedIn || false,
      username: session?.username || 'Guest',
      userRole: session?.role || '',
      message,
      messageType,
      activePage: { schedules: true },
    };
  }

  @Get(':id')
  @Render('schedules/detail')
  async findOne(@Param('id') id: string | number, @Req() req: Request) {
    const session = (req as any).session;
    const schedule = await this.schedulesService.findOne(Number(id));
    return {
      title: schedule ? `Schedule #${schedule.id}` : 'Schedule Not Found',
      schedule,
      isLoggedIn: session?.isLoggedIn || false,
      username: session?.username || 'Guest',
      userRole: session?.role || '',
      activePage: { schedules: true },
    };
  }

  @Delete(':id')
  async remove(@Param('id') id: string, @Res() res: Response) {
    try {
      await this.schedulesService.remove(id);
      return res.json({ success: true, message: 'Schedule deleted successfully' });
    } catch (error: any) {
      return res.status(400).json({ success: false, message: error.message });
    }
  }
}
