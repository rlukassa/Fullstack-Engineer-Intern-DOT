import { Controller, Get, Post, Body, Param, Delete, Render } from '@nestjs/common';
import { BookingsService } from './bookings.service';
import { CreateBookingDto } from './dto/create-booking.dto';

@Controller('bookings')
export class BookingsController {
  constructor(private readonly bookingsService: BookingsService) {}

  @Post()
  async create(@Body() createBookingDto: CreateBookingDto) {
    return this.bookingsService.create(createBookingDto);
  }

  @Get()
  @Render('bookings/index')
  async findAll() {
    const bookings = await this.bookingsService.findAll();
    return { bookings };
  }

  @Get(':id')
  @Render('bookings/detail')
  async findOne(@Param('id') id: number) {
    const booking = await this.bookingsService.findOne(id);
    return { booking };
  }

  @Delete(':id')
  async remove(@Param('id') id: number) {
    return this.bookingsService.remove(id);
  }
}
