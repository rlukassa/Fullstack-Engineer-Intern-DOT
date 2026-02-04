import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  OneToMany,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Train } from '../../trains/entities/train.entity';
import { Station } from '../../stations/entities/station.entity';
import { Booking } from '../../bookings/entities/booking.entity';

@Entity('schedules')
export class Schedule {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  trainId: number;

  @Column()
  originStationId: number;

  @Column()
  destinationStationId: number;

  @Column({ type: 'timestamp' })
  departureTime: Date;

  @Column({ type: 'timestamp' })
  arrivalTime: Date;

  @Column({ type: 'int' })
  price: number;

  @ManyToOne(() => Train, (train) => train.schedules, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'trainId' })
  train: Train;

  @ManyToOne(() => Station, (station) => station.departureSchedules)
  @JoinColumn({ name: 'originStationId' })
  originStation: Station;

  @ManyToOne(() => Station, (station) => station.arrivalSchedules)
  @JoinColumn({ name: 'destinationStationId' })
  destinationStation: Station;

  @OneToMany(() => Booking, (booking) => booking.schedule)
  bookings: Booking[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
