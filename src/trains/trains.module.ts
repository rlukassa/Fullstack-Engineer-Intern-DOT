import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TrainsService } from './trains.service';
import { TrainsController } from './trains.controller';
import { Train } from './entities/train.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Train])],
  controllers: [TrainsController],
  providers: [TrainsService],
  exports: [TrainsService],
})
export class TrainsModule {}
