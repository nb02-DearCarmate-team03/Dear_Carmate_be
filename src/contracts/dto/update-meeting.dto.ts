import { IsArray, IsDateString, IsOptional } from 'class-validator';

export class UpdateMeetingDto {
  @IsDateString()
  date!: string;

  @IsOptional()
  @IsArray()
  alarms?: string[];
}
