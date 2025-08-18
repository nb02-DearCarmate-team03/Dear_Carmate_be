import { IsArray, IsOptional, IsString } from 'class-validator';
import { ToKoreaStandardTimeDateTime } from '../../common/utils/contract.converter';

export class MeetingDto {
  @IsOptional()
  @IsString()
  @ToKoreaStandardTimeDateTime()
  date?: string;

  @IsArray()
  @IsOptional()
  @ToKoreaStandardTimeDateTime()
  alarms?: string[];
}
