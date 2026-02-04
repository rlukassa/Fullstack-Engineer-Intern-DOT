import { Controller, Get, Post, Body, Param, Delete, Render } from '@nestjs/common';
import { TrainsService } from './trains.service';
import { CreateTrainDto } from './dto/create-train.dto';

@Controller('trains')
export class TrainsController {
  constructor(private readonly trainsService: TrainsService) {}

  @Post()
  async create(@Body() createTrainDto: CreateTrainDto) {
    return this.trainsService.create(createTrainDto);
  }

  @Get()
  @Render('trains/index')
  async findAll() {
    const trains = await this.trainsService.findAll();
    return { trains };
  }

  @Get(':id')
  @Render('trains/detail')
  async findOne(@Param('id') id: string | number) {
    const train = await this.trainsService.findOne(Number(id));
    return { train };
  }

  @Delete(':id')
  async remove(@Param('id') id: string) {
    return this.trainsService.remove(id);
  }
}
