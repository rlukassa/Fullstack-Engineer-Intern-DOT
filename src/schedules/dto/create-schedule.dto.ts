export class CreateScheduleDto {
  trainId: number;
  originStationId: number;
  destinationStationId: number;
  departureTime: Date;
  arrivalTime: Date;
  price: number;
}
