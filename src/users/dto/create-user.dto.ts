import {
  IsString,
  IsEmail,
  IsOptional,
  MinLength,
  MaxLength,
  IsNotEmpty,
  Length,
} from 'class-validator';

class RegisterDto {
  @IsNotEmpty({ message: '이름은 필수 입력 항목입니다.' })
  @IsString({ message: '이름은 문자열이어야 합니다.' })
  @Length(2, 50, { message: '이름은 2자 이상 50자 이하여야 합니다.' })
  name: string;

  @IsEmail({}, { message: '이메일 주소가 정확한지 확인해 주세요.' })
  email: string;

  @IsString({ message: '사원번호는 문자열이어야 합니다.' })
  employeeNumber: string;

  @IsString({ message: '전화번호는 문자열이어야 합니다.' })
  phoneNumber: string;

  @IsNotEmpty({ message: '비밀번호는 필수 입력 항목입니다.' })
  @IsString()
  @MinLength(10, { message: '비밀번호는 최소 10자 이상이어야 합니다.' })
  @MaxLength(255, { message: '비밀번호는 최대 255자 이하여야 합니다.' })
  password: string;

  @IsNotEmpty({ message: '비밀번호는 필수 입력 항목입니다.' })
  @IsString()
  @MinLength(10, { message: '비밀번호 확인은 최소 10자 이상이어야 합니다.' })
  @MaxLength(255, { message: '비밀번호 확인은 최대 255자 이하여야 합니다.' })
  passwordConfirmation: string;

  @IsOptional()
  @IsString()
  imageUrl?: string;

  @IsString({ message: '기업명은 문자열이어야 합니다.' })
  companyName: string;

  @IsString({ message: '기업코드는 문자열이어야 합니다.' })
  companyCode: string;
}

export interface RegisterResponse {
  id: number;
  name: string;
  email: string;
  employeeNumber: string;
  phoneNumber: string;
  imageUrl: string | null;
  isAdmin: boolean;
  company: {
    companyCode: string;
  };
}

export default RegisterDto;
