import { Controller, Get, Post, Body, Param, Delete, Render } from '@nestjs/common';
import { SchedulesService } from './schedules.service';
import { CreateScheduleDto } from './dto/create-schedule.dto';

@Controller('schedules')
export class SchedulesController {
  constructor(private readonly schedulesService: SchedulesService) {}

  @Post()
  async create(@Body() createScheduleDto: CreateScheduleDto) {
    return this.schedulesService.create(createScheduleDto);
  }

  @Get()
  @Render('schedules/index')
  async findAll() {
    const schedules = await this.schedulesService.findAll();
    return { schedules };
  }

  @Get(':id')
  @Render('schedules/detail')
  async findOne(@Param('id') id: string | number) {
    const schedule = await this.schedulesService.findOne(Number(id));
    return { schedule };
  }

  @Delete(':id')
  async remove(@Param('id') id: string) {
    return this.schedulesService.remove(id);
  }
}
