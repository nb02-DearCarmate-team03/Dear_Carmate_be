import bcrypt from 'bcrypt';
import UserRepository from './repository';
import RegisterDto, { RegisterResponse } from './dto/create-user.dto';

class UserService {
  /**
   * 회원가입
   */
  static async register(data: RegisterDto): Promise<RegisterResponse> {
    const {
      name,
      email,
      employeeNumber,
      phoneNumber,
      password,
      passwordConfirmation,
      company,
      companyCode,
    } = data;

    const existingUser = await UserRepository.findByEmail(email);
    if (existingUser) throw new Error('이미 존재하는 이메일입니다.');

    const companyEntity = await UserRepository.findCompanyByNameAndCode(company, companyCode);
    if (!companyEntity) throw new Error('기업 정보가 유효하지 않습니다.');

    if (password !== passwordConfirmation) {
      throw new Error('비밀번호와 비밀번호 확인이 일치하지 않습니다');
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = await UserRepository.createUser({
      name,
      email,
      employeeNumber,
      phoneNumber,
      password: hashedPassword,
      companyId: companyEntity.id,
    });

    /**
     * 응답 데이터 가공
     */
    return {
      id: newUser.id,
      name: newUser.name,
      email: newUser.email,
      employeeNumber: newUser.employeeNumber,
      phoneNumber: newUser.phoneNumber,
      isAdmin: newUser.isAdmin,
      company: {
        companyCode: newUser.company.companyCode,
      },
    };
  }
}

export default UserService;
