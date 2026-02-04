import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToMany,
} from 'typeorm';
import { Schedule } from '../../schedules/entities/schedule.entity';

@Entity('stations')
export class Station {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', length: 50 })
  name: string;

  @Column({ type: 'varchar', length: 3, unique: true })
  code: string;

  @OneToMany(() => Schedule, (schedule) => schedule.originStation)
  departureSchedules: Schedule[];

  @OneToMany(() => Schedule, (schedule) => schedule.destinationStation)
  arrivalSchedules: Schedule[];
}
