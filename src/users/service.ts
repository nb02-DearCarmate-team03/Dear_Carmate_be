import bcrypt from 'bcrypt';
import UserRepository from './repository';
import RegisterDto, { RegisterResponse } from './dto/create-user.dto';
import UpdateUserDto, { UpdateUserResponse } from './dto/update-user.dto';
import {
  BadRequestError,
  ConflictError,
  NotFoundError,
  UnauthorizedError,
} from '../middlewares/error.middleware';

class UserService {
  /**
   * 회원가입
   */
  private userRepository: UserRepository;

  constructor(userRepository: UserRepository) {
    this.userRepository = userRepository;
  }

  async register(data: RegisterDto): Promise<RegisterResponse> {
    const {
      name,
      email,
      employeeNumber,
      phoneNumber,
      password,
      passwordConfirmation,
      imageUrl,
      company,
      companyCode,
    } = data;

    const existingUser = await this.userRepository.findByEmail(email);
    if (existingUser) throw new ConflictError('이미 존재하는 이메일입니다.');

    const companyEntity = await this.userRepository.findCompanyByNameAndCode(company, companyCode);
    if (!companyEntity) throw new BadRequestError('기업 정보가 유효하지 않습니다.');

    if (password !== passwordConfirmation) {
      throw new BadRequestError('비밀번호와 비밀번호 확인이 일치하지 않습니다');
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = await this.userRepository.createUser({
      name,
      email,
      employeeNumber,
      phoneNumber,
      imageUrl,
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
      imageUrl: newUser.imageUrl,
      isAdmin: newUser.isAdmin,
      company: {
        companyCode: newUser.company.companyCode,
      },
    };
  }

  async getInfo(userId: number): Promise<RegisterResponse> {
    const user = await this.userRepository.findWithCompanyByUserId(userId);
    if (!user) throw new NotFoundError('존재하지 않는 유저입니다.');

    return {
      id: user.id,
      name: user.name,
      email: user.email,
      employeeNumber: user.employeeNumber,
      phoneNumber: user.phoneNumber,
      imageUrl: user.imageUrl,
      isAdmin: user.isAdmin,
      company: {
        companyCode: user.company.companyCode,
      },
    };
  }

  async updateProfile(userId: number, data: UpdateUserDto): Promise<UpdateUserResponse> {
    const user = await this.userRepository.findWithCompanyByUserId(userId);
    if (!user) throw new NotFoundError('존재하지 않는 유저입니다.');

    // 2차 인증: currentPassword 필수
    if (data.password || data.phoneNumber || data.employeeNumber) {
      if (!data.currentPassword) {
        throw new BadRequestError('현재 비밀번호가 맞지 않습니다.');
      }

      const isValid = await bcrypt.compare(data.currentPassword, user.password);
      if (!isValid) throw new UnauthorizedError('비밀번호가 일치하지 않습니다.');
    }
    // 비밀번호 검증
    if (data.password && data.password !== data.passwordConfirmation) {
      throw new BadRequestError('비밀번호와 비밀번호 확인이 일치하지 않습니다.');
    }

    const hashedPassword = data.password ? await bcrypt.hash(data.password, 10) : undefined;
    // 정보 업데이트
    const updatedUser = await this.userRepository.updateUser(userId, {
      employeeNumber: data.employeeNumber,
      phoneNumber: data.phoneNumber,
      imageUrl: data.imageUrl,
      ...(hashedPassword ? { password: hashedPassword } : {}),
    });

    return {
      id: updatedUser.id,
      name: updatedUser.name,
      email: updatedUser.email,
      employeeNumber: updatedUser.employeeNumber,
      phoneNumber: updatedUser.phoneNumber,
      imageUrl: updatedUser.imageUrl ?? undefined,
      isAdmin: updatedUser.isAdmin,
      company: {
        companyCode: updatedUser.company.companyCode,
      },
    };
  }

  async deleteUser(userId: number): Promise<void> {
    const user = await this.userRepository.findWithCompanyByUserId(userId);
    if (!user) throw new NotFoundError('존재하지 않는 유저입니다.');

    await this.userRepository.deleteUser(userId);
  }
}

export default UserService;
