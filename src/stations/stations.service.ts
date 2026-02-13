import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateStationDto } from './dto/create-station.dto';
import { Station } from './entities/station.entity';

@Injectable()
export class StationsService {
  constructor(
    @InjectRepository(Station)
    private stationsRepository: Repository<Station>,
  ) {}

  async create(createStationDto: CreateStationDto) {
    const station = this.stationsRepository.create(createStationDto);
    return this.stationsRepository.save(station);
  }

  async findAll(search?: string) {
    if (search) {
      return this.stationsRepository
        .createQueryBuilder('station')
        .where('station.name ILIKE :query', { query: `%${search}%` })
        .orWhere('station.code ILIKE :query', { query: `%${search}%` })
        .orderBy('station.id', 'ASC')
        .getMany();
    }
    return this.stationsRepository.find({
      order: {
        id: 'ASC',
      },
    });
  }

  async findOne(id: number) {
    return this.stationsRepository.findOne({
      where: { id },
    });
  }

  async update(id: number, updateStationDto: any) {
    await this.stationsRepository.update(id, updateStationDto);
    return this.findOne(id);
  }

  async remove(id: number) {
    return this.stationsRepository.softDelete(id);
  }
}
