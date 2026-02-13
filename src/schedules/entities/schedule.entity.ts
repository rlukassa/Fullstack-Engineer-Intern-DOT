import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  OneToMany,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
} from 'typeorm';
import { Train } from '../../trains/entities/train.entity';
import { Station } from '../../stations/entities/station.entity';
import { Booking } from '../../bookings/entities/booking.entity';

// Status Perjalanan Kereta: BELUM_BERANGKAT, DALAM_PERJALANAN, TIBA_LOKASI
export enum JourneyStatus {
  BELUM_BERANGKAT = 'BELUM_BERANGKAT',     // Kereta belum berangkat
  DALAM_PERJALANAN = 'DALAM_PERJALANAN',   // Kereta dalam perjalanan
  TIBA_LOKASI = 'TIBA_LOKASI',             // Kereta sudah tiba di tujuan
}

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

  @Column({ type: 'timestamptz' })
  departureTime: Date;

  @Column({ type: 'timestamptz' })
  arrivalTime: Date;

  @Column({ type: 'int' })
  price: number;

  @Column({ type: 'varchar', default: JourneyStatus.BELUM_BERANGKAT })
  journeyStatus: JourneyStatus; // BELUM_BERANGKAT / DALAM_PERJALANAN / TIBA_LOKASI

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

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt: Date;

  @DeleteDateColumn({ type: 'timestamptz' })
  deletedAt: Date;
}
