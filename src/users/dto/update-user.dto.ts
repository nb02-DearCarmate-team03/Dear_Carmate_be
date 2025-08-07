import { IsOptional, IsString, MinLength, MaxLength, Matches } from 'class-validator';

class UpdateUserDto {
  @IsOptional()
  @IsString()
  employeeNumber?: string;

  @IsOptional()
  @IsString()
  phoneNumber?: string;

  @IsOptional()
  @IsString()
  @MinLength(10, { message: '현재 비밀번호는 최소 10자 이상입니다.' })
  currentPassword?: string;

  @IsString()
  @MinLength(8, { message: '비밀번호는 최소 8자 이상이어야 합니다.' })
  @MaxLength(255, { message: '비밀번호는 최대 255자 이하여야 합니다.' })
  password?: string;

  @IsString()
  @MinLength(8, { message: '비밀번호 확인은 최소 8자 이상이어야 합니다.' })
  @MaxLength(255, { message: '비밀번호 확인은 최대 255자 이하여야 합니다.' })
  passwordConfirmation?: string;

  @IsOptional()
  @IsString()
  imageUrl?: string;
}

export interface UpdateUserResponse {
  id: number;
  name: string;
  email: string;
  employeeNumber?: string;
  phoneNumber?: string;
  imageUrl?: string;
  isAdmin: boolean;
  company: {
    companyCode: string;
  };
}
export default UpdateUserDto;
