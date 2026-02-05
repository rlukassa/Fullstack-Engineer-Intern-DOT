import { BookingStatus } from '../entities/booking.entity';

export class CreateBookingDto {
  userId: number;
  bookingCode: string;
  scheduleId: number;
  seatCount?: number;
  totalPrice?: number;
  status?: BookingStatus;
}
