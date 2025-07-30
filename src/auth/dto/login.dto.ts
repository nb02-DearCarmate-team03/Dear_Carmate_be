import { IsEmail, IsString, MinLength, MaxLength, IsNotEmpty } from 'class-validator';
import { User } from '@prisma/client';

export class LoginDto {
  @IsNotEmpty()
  @IsEmail({}, { message: '유효한 이메일 형식이 아닙니다.' })
  email: string;

  @IsNotEmpty()
  @IsString({ message: ' 비밀번호는 문자열이어야 합니다.' })
  @MinLength(10, { message: '비밀번호는 최소 10자 이상이어야 합니다.' })
  @MaxLength(255, { message: '비밀번호는 최대 255자 이하여야 합니다.' })
  password: string;
}

export type AuthUserPayload = User & {
  company: {
    companyCode: string;
  };
};
