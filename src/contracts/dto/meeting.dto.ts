import { IsArray, IsDateString, IsOptional } from 'class-validator';

export class MeetingDto {
  @IsDateString()
  date!: string;

  @IsOptional()
  @IsArray()
  @IsDateString({}, { each: true })
  alarms?: string[];
}
