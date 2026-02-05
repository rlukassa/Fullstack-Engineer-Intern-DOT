import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateBookingDto } from './dto/create-booking.dto';
import { Booking } from './entities/booking.entity';

@Injectable()
export class BookingsService {
  constructor(
    @InjectRepository(Booking)
    private bookingsRepository: Repository<Booking>,
  ) {}

  async create(createBookingDto: CreateBookingDto) {
    const booking = this.bookingsRepository.create(createBookingDto);
    return this.bookingsRepository.save(booking);
  }

  async findAll() {
    return this.bookingsRepository.find({
      relations: ['user', 'schedule', 'schedule.train', 'schedule.originStation', 'schedule.destinationStation'],
      order: {
        createdAt: 'DESC',
      },
    });
  }

  async findByUser(userId: number) {
    return this.bookingsRepository.find({
      where: { user: { id: userId } },
      relations: ['user', 'schedule', 'schedule.train', 'schedule.originStation', 'schedule.destinationStation'],
      order: {
        createdAt: 'DESC',
      },
    });
  }

  async findOne(id: number) {
    return this.bookingsRepository.findOne({
      where: { id },
      relations: ['user', 'schedule', 'schedule.train', 'schedule.originStation', 'schedule.destinationStation'],
    });
  }

  async update(id: number, updateBookingDto: any) {
    await this.bookingsRepository.update(id, updateBookingDto);
    return this.findOne(id);
  }

  async remove(id: number) {
    return this.bookingsRepository.delete(id);
  }
}
