import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToMany,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
} from 'typeorm';
import { Schedule } from '../../schedules/entities/schedule.entity';

@Entity('trains')
export class Train {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', length: 20 })
  name: string;

  @Column({ type: 'varchar' })
  type: string; // Ekonomi / Eksekutif

  @Column({ type: 'int' })
  totalSeats: number;

  @OneToMany(() => Schedule, (schedule) => schedule.train)
  schedules: Schedule[];

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt: Date;

  @DeleteDateColumn({ type: 'timestamptz' })
  deletedAt: Date;
}
