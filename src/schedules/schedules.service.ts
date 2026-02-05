import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThanOrEqual, MoreThan, Between } from 'typeorm';
import { CreateScheduleDto } from './dto/create-schedule.dto';
import { Schedule, JourneyStatus } from './entities/schedule.entity';

@Injectable()
export class SchedulesService {
  constructor(
    @InjectRepository(Schedule)
    private schedulesRepository: Repository<Schedule>,
  ) {}

  async create(createScheduleDto: CreateScheduleDto) {
    const schedule = this.schedulesRepository.create({
      ...createScheduleDto,
      journeyStatus: JourneyStatus.BELUM_BERANGKAT,
    });
    return this.schedulesRepository.save(schedule);
  }

  async findAll() {
    return this.schedulesRepository.find({
      relations: ['train', 'originStation', 'destinationStation'],
      order: {
        departureTime: 'ASC',
      },
    });
  }

  async search(query: string) {
    return this.schedulesRepository
      .createQueryBuilder('schedule')
      .leftJoinAndSelect('schedule.train', 'train')
      .leftJoinAndSelect('schedule.originStation', 'originStation')
      .leftJoinAndSelect('schedule.destinationStation', 'destinationStation')
      .where('train.name ILIKE :query', { query: `%${query}%` })
      .orWhere('originStation.name ILIKE :query', { query: `%${query}%` })
      .orWhere('destinationStation.name ILIKE :query', { query: `%${query}%` })
      .orderBy('schedule.departureTime', 'ASC')
      .getMany();
  }

  async findOne(id: number) {
    return this.schedulesRepository.findOne({
      where: { id },
      relations: ['train', 'originStation', 'destinationStation', 'bookings'],
    });
  }

  async update(id: string | number, updateScheduleDto: any) {
    await this.schedulesRepository.update(Number(id), updateScheduleDto);
    return this.findOne(Number(id));
  }

  async updateJourneyStatus(id: number, status: JourneyStatus) {
    await this.schedulesRepository.update(id, { journeyStatus: status });
    return this.findOne(id);
  }

  async remove(id: string) {
    return this.schedulesRepository.softDelete(id);
  }

  async count() {
    return this.schedulesRepository.count();
  }

  // Auto-update journey status based on time (to be called by a cron job or manually)
  async updateAllJourneyStatuses() {
    const now = new Date();

    // Update schedules that should be DALAM_PERJALANAN (departed but not arrived)
    await this.schedulesRepository
      .createQueryBuilder()
      .update(Schedule)
      .set({ journeyStatus: JourneyStatus.DALAM_PERJALANAN })
      .where('departureTime <= :now', { now })
      .andWhere('arrivalTime > :now', { now })
      .andWhere('journeyStatus != :arrived', { arrived: JourneyStatus.TIBA_LOKASI })
      .execute();

    // Update schedules that should be TIBA_LOKASI (arrived)
    await this.schedulesRepository
      .createQueryBuilder()
      .update(Schedule)
      .set({ journeyStatus: JourneyStatus.TIBA_LOKASI })
      .where('arrivalTime <= :now', { now })
      .execute();

    return { updated: true, timestamp: now };
  }

  // Get schedules with specific journey status
  async findByJourneyStatus(status: JourneyStatus) {
    return this.schedulesRepository.find({
      where: { journeyStatus: status },
      relations: ['train', 'originStation', 'destinationStation'],
      order: {
        departureTime: 'ASC',
      },
    });
  }
}
