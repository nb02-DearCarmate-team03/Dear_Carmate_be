import { IsArray, IsDateString, IsString } from 'class-validator';

export class MeetingDto {
  @IsDateString()
  date: string;

  @IsArray()
  @IsString({ each: true })
  alarms: string[];
}
