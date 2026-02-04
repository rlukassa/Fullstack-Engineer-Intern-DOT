export class CreateBookingDto {
  userId: number;
  bookingCode: string;
  scheduleId: number;
  status?: string;
}
