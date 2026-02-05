import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, ILike } from 'typeorm';
import { CreateScheduleDto } from './dto/create-schedule.dto';
import { Schedule } from './entities/schedule.entity';

@Injectable()
export class SchedulesService {
  constructor(
    @InjectRepository(Schedule)
    private schedulesRepository: Repository<Schedule>,
  ) {}

  async create(createScheduleDto: CreateScheduleDto) {
    const schedule = this.schedulesRepository.create(createScheduleDto);
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
      relations: ['train', 'originStation', 'destinationStation'],
    });
  }

  async update(id: string | number, updateScheduleDto: any) {
    await this.schedulesRepository.update(Number(id), updateScheduleDto);
    return this.findOne(Number(id));
  }

  async remove(id: string) {
    return this.schedulesRepository.delete(id);
  }

  async count() {
    return this.schedulesRepository.count();
  }
}
