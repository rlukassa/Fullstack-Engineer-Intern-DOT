import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateTrainDto } from './dto/create-train.dto';
import { Train } from './entities/train.entity';

@Injectable()
export class TrainsService {
  constructor(
    @InjectRepository(Train)
    private trainsRepository: Repository<Train>,
  ) {}

  async create(createTrainDto: CreateTrainDto) {
    const train = this.trainsRepository.create(createTrainDto);
    return this.trainsRepository.save(train);
  }

  async findAll() {
    return this.trainsRepository.find({
      order: {
        createdAt: 'DESC',
      },
    });
  }

  async findOne(id: number) {
    return this.trainsRepository.findOne({
      where: { id },
      relations: ['schedules'],
    });
  }

  async update(id: string | number, updateTrainDto: any) {
    await this.trainsRepository.update(Number(id), updateTrainDto);
    return this.findOne(Number(id));
  }

  async remove(id: string) {
    return this.trainsRepository.softDelete(id);
  }
}
