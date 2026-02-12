import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { CreateBookingDto } from './dto/create-booking.dto';
import { Booking, BookingStatus } from './entities/booking.entity';
import { Schedule, JourneyStatus } from '../schedules/entities/schedule.entity';
import { Train } from '../trains/entities/train.entity';
import { User } from '../auth/entities/user.entity';

@Injectable()
export class BookingsService {
  constructor(
    @InjectRepository(Booking)
    private bookingsRepository: Repository<Booking>,
    @InjectRepository(Schedule)
    private schedulesRepository: Repository<Schedule>,
    @InjectRepository(User)
    private usersRepository: Repository<User>,
    @InjectRepository(Train)
    private trainsRepository: Repository<Train>,
  ) {}

  // Get total booked seats for a schedule (only CONFIRMED and PENDING bookings)
  async getBookedSeats(scheduleId: number): Promise<number> {
    const result = await this.bookingsRepository
      .createQueryBuilder('booking')
      .select('SUM(booking.seatCount)', 'total')
      .where('booking.scheduleId = :scheduleId', { scheduleId })
      .andWhere('booking.status IN (:...statuses)', { statuses: [BookingStatus.CONFIRMED, BookingStatus.PENDING] })
      .getRawOne();
    
    return parseInt(result?.total) || 0;
  }

  // Get available seats for a schedule
  async getAvailableSeats(scheduleId: number): Promise<{ available: number; total: number; booked: number }> {
    const schedule = await this.schedulesRepository.findOne({
      where: { id: scheduleId },
      relations: ['train'],
    });

    if (!schedule || !schedule.train) {
      return { available: 0, total: 0, booked: 0 };
    }

    const bookedSeats = await this.getBookedSeats(scheduleId);
    const totalSeats = Number(schedule.train.totalSeats) || 0;
    const availableSeats = Math.max(0, totalSeats - bookedSeats);

    return { available: availableSeats, total: totalSeats, booked: bookedSeats };
  }

  async create(createBookingDto: CreateBookingDto) {
    // Generate booking code
    const bookingCode = `TKT-${Date.now()}-${Math.random().toString(36).substr(2, 6).toUpperCase()}`;
    
    // Get schedule to calculate price
    const schedule = await this.schedulesRepository.findOne({
      where: { id: createBookingDto.scheduleId }
    });
    
    if (!schedule) {
      throw new Error('Jadwal tidak ditemukan');
    }

    // Check if schedule has departed
    if (schedule.journeyStatus !== JourneyStatus.BELUM_BERANGKAT) {
      throw new Error('Kereta sudah berangkat atau sudah tiba, tidak bisa memesan');
    }

    const seatCount = createBookingDto.seatCount || 1;

    // Check seat availability
    const seatInfo = await this.getAvailableSeats(createBookingDto.scheduleId);
    if (seatInfo.available < seatCount) {
      if (seatInfo.available === 0) {
        throw new Error(`Kursi sudah habis untuk jadwal ini (total: ${seatInfo.total}, terpesan: ${seatInfo.booked})`);
      }
      throw new Error(`Hanya tersisa ${seatInfo.available} kursi, Anda memesan ${seatCount} kursi`);
    }

    const totalPrice = schedule.price * seatCount;

    const booking = this.bookingsRepository.create({
      ...createBookingDto,
      bookingCode,
      seatCount,
      totalPrice,
      status: BookingStatus.PENDING,
    });

    return this.bookingsRepository.save(booking);
  }

  async payBooking(bookingId: number, userId: number): Promise<{ success: boolean; error?: string; booking?: Booking }> {
    const booking = await this.findOne(bookingId);

    if (!booking) {
      return { success: false, error: 'Pemesanan tidak ditemukan' };
    }

    if (booking.userId !== userId) {
      return { success: false, error: 'Anda tidak memiliki akses ke pemesanan ini' };
    }

    if (booking.status !== BookingStatus.PENDING) {
      return { success: false, error: 'Pemesanan sudah dibayar atau dibatalkan' };
    }

    // Check if schedule is still available
    if (booking.schedule.journeyStatus !== JourneyStatus.BELUM_BERANGKAT) {
      return { success: false, error: 'Kereta sudah berangkat, tidak bisa membayar' };
    }

    // Get user and check balance
    const user = await this.usersRepository.findOne({ where: { id: userId } });

    if (!user) {
      return { success: false, error: 'User tidak ditemukan' };
    }

    const userBalance = Number(user.balance) || 0;

    if (userBalance < booking.totalPrice) {
      return { 
        success: false, 
        error: `Saldo tidak mencukupi. Saldo Anda: Rp ${userBalance.toLocaleString('id-ID')}, Total: Rp ${booking.totalPrice.toLocaleString('id-ID')}` 
      };
    }

    // Deduct balance
    const newBalance = userBalance - booking.totalPrice;
    await this.usersRepository.update(userId, { balance: newBalance });

    // Update booking status
    const now = new Date();
    await this.bookingsRepository.update(bookingId, {
      status: BookingStatus.CONFIRMED,
      paidAt: now,
    });

    const updatedBooking = await this.findOne(bookingId);
    return { success: true, booking: updatedBooking! };
  }

  async cancelBooking(bookingId: number, userId: number, isAdmin: boolean = false): Promise<{ success: boolean; error?: string; refundAmount?: number }> {
    const booking = await this.findOne(bookingId);

    if (!booking) {
      return { success: false, error: 'Pemesanan tidak ditemukan' };
    }

    if (!isAdmin && booking.userId !== userId) {
      return { success: false, error: 'Anda tidak memiliki akses ke pemesanan ini' };
    }

    if (booking.status === BookingStatus.CANCELLED) {
      return { success: false, error: 'Pemesanan sudah dibatalkan' };
    }

    let refundAmount = 0;

    // If booking was confirmed, refund the user
    if (booking.status === BookingStatus.CONFIRMED) {
      // Check if train hasn't departed yet
      if (booking.schedule.journeyStatus === JourneyStatus.BELUM_BERANGKAT) {
        refundAmount = booking.totalPrice;
        
        // Refund balance
        const user = await this.usersRepository.findOne({ where: { id: booking.userId } });
        if (user) {
          const currentBalance = Number(user.balance) || 0;
          await this.usersRepository.update(booking.userId, { balance: currentBalance + refundAmount });
        }
      }
    }

    // Update booking status
    await this.bookingsRepository.update(bookingId, {
      status: BookingStatus.CANCELLED,
    });

    return { success: true, refundAmount };
  }

  async updateStatus(bookingId: number, status: BookingStatus) {
    await this.bookingsRepository.update(bookingId, { status });
    return this.findOne(bookingId);
  }

  async findAll() {
    return this.bookingsRepository.find({
      relations: ['user', 'schedule', 'schedule.train', 'schedule.originStation', 'schedule.destinationStation'],
      order: {
        createdAt: 'DESC',
      },
    });
  }

  async findByUser(userId: number) {
    return this.bookingsRepository.find({
      where: { userId },
      relations: ['user', 'schedule', 'schedule.train', 'schedule.originStation', 'schedule.destinationStation'],
      order: {
        createdAt: 'DESC',
      },
    });
  }

  // Find user's active (PENDING/CONFIRMED) booking for a specific schedule
  async findActiveBookingByUserAndSchedule(userId: number, scheduleId: number): Promise<Booking | null> {
    return this.bookingsRepository.findOne({
      where: [
        { userId, scheduleId, status: BookingStatus.PENDING },
        { userId, scheduleId, status: BookingStatus.CONFIRMED },
      ],
    });
  }

  async findOne(id: number) {
    return this.bookingsRepository.findOne({
      where: { id },
      relations: ['user', 'schedule', 'schedule.train', 'schedule.originStation', 'schedule.destinationStation'],
    });
  }

  async update(id: number, updateBookingDto: any) {
    await this.bookingsRepository.update(id, updateBookingDto);
    return this.findOne(id);
  }

  async remove(id: number) {
    return this.bookingsRepository.delete(id);
  }

  async count() {
    return this.bookingsRepository.count();
  }

  async countByUser(userId: number) {
    return this.bookingsRepository.count({ where: { userId } });
  }

  // Refund all confirmed bookings for a schedule (when admin updates schedule)
  async refundBookingsForSchedule(scheduleId: number, reason: string): Promise<{ refunded: number; totalRefundAmount: number }> {
    const bookings = await this.bookingsRepository.find({
      where: { 
        scheduleId, 
        status: BookingStatus.CONFIRMED 
      },
      relations: ['user'],
    });

    let totalRefundAmount = 0;
    const now = new Date();

    for (const booking of bookings) {
      // Refund balance to user
      if (booking.user) {
        const currentBalance = Number(booking.user.balance) || 0;
        await this.usersRepository.update(booking.userId, { 
          balance: currentBalance + Number(booking.totalPrice) 
        });
        totalRefundAmount += Number(booking.totalPrice);
      }

      // Update booking status
      await this.bookingsRepository.update(booking.id, {
        status: BookingStatus.CANCELLED,
        refundReason: reason,
        refundedAt: now,
      });
    }

    return { refunded: bookings.length, totalRefundAmount };
  }

  // Refund all confirmed bookings for a train (when admin updates train)
  async refundBookingsForTrain(trainId: number, reason: string): Promise<{ refunded: number; totalRefundAmount: number }> {
    // Find all schedules for this train
    const schedules = await this.schedulesRepository.find({
      where: { trainId },
    });

    let totalRefunded = 0;
    let totalRefundAmount = 0;

    for (const schedule of schedules) {
      const result = await this.refundBookingsForSchedule(schedule.id, reason);
      totalRefunded += result.refunded;
      totalRefundAmount += result.totalRefundAmount;
    }

    return { refunded: totalRefunded, totalRefundAmount };
  }

  // Find bookings with refund notification (for user to see)
  async findRefundedByUser(userId: number) {
    return this.bookingsRepository.find({
      where: { 
        userId,
        status: BookingStatus.CANCELLED,
        refundReason: In(['', null]) // Has refund reason (not null)
      },
      relations: ['schedule', 'schedule.train', 'schedule.originStation', 'schedule.destinationStation'],
      order: {
        refundedAt: 'DESC',
      },
    });
  }
}
