import { Controller, Get, Post, Body, Param, Delete, Render } from '@nestjs/common';
import { StationsService } from './stations.service';
import { CreateStationDto } from './dto/create-station.dto';

@Controller('stations')
export class StationsController {
  constructor(private readonly stationsService: StationsService) {}

  @Post()
  async create(@Body() createStationDto: CreateStationDto) {
    return this.stationsService.create(createStationDto);
  }

  @Get()
  @Render('stations/index')
  async findAll() {
    const stations = await this.stationsService.findAll();
    return { stations };
  }

  @Get(':id')
  @Render('stations/detail')
  async findOne(@Param('id') id: number) {
    const station = await this.stationsService.findOne(id);
    return { station };
  }

  @Delete(':id')
  async remove(@Param('id') id: number) {
    return this.stationsService.remove(id);
  }
}
