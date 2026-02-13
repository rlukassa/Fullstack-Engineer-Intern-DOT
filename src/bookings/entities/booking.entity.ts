import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
} from 'typeorm';
import { User } from '../../auth/entities/user.entity';
import { Schedule } from '../../schedules/entities/schedule.entity';

// Status Booking: PENDING (Menunggu), CONFIRMED (Terkonfirmasi), CANCELLED (Dibatalkan)
export enum BookingStatus {
  PENDING = 'PENDING',      // Menunggu Pembayaran
  CONFIRMED = 'CONFIRMED',  // Terkonfirmasi / Sudah Bayar
  CANCELLED = 'CANCELLED',  // Dibatalkan
}

@Entity('bookings')
export class Booking {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  userId: number;

  @Column({ type: 'varchar', unique: true })
  bookingCode: string;

  @Column()
  scheduleId: number;

  @Column({ type: 'int', default: 1 })
  seatCount: number;

  @Column({ type: 'bigint', default: 0 })
  totalPrice: number;

  @Column({ type: 'varchar', default: BookingStatus.PENDING })
  status: BookingStatus; // PENDING / CONFIRMED / CANCELLED

  @Column({ type: 'timestamptz', nullable: true })
  paidAt: Date; // Waktu pembayaran

  @Column({ type: 'varchar', nullable: true })
  refundReason: string; // Alasan refund (jika dibatalkan oleh admin)

  @Column({ type: 'timestamptz', nullable: true })
  refundedAt: Date; // Waktu refund

  @ManyToOne(() => User, (user) => user.bookings)
  @JoinColumn({ name: 'userId' })
  user: User;

  @ManyToOne(() => Schedule, (schedule) => schedule.bookings, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'scheduleId' })
  schedule: Schedule;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt: Date;

  @DeleteDateColumn({ type: 'timestamptz' })
  deletedAt: Date;
}
