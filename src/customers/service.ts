/* eslint-disable */
import {
  PrismaClient,
  Prisma,
  UploadType,
  UploadStatus,
  Gender,
  AgeGroup,
  Region,
} from '@prisma/client';
import { parse } from 'csv-parse';
import { Readable } from 'stream';
import { CustomerRepository } from './repository';
import { CreateCustomerDto } from './dto/create-customer.dto';
import { UpdateCustomerDto } from './dto/update-customer.dto';
import { ConflictError } from '../common/errors/conflict-error';
import { NotFoundError } from '../common/errors/not-found-error';
import { BadRequestError } from '../common/errors/bad-request-error';

// Enum을 한글로 변환하는 유틸리티 함수들
class EnumConverter {
  // Gender enum을 한글로 변환
  static genderToKorean(gender: Gender | null): string | null {
    if (!gender) return null;

    // Prisma에서 실제로 반환하는 값은 @map으로 정의된 "male", "female"입니다
    const genderMap: Record<string, string> = {
      male: 'male',
      female: 'female',
      MALE: 'male', // 혹시 모를 대문자 케이스도 처리
      FEMALE: 'female',
    };

    return genderMap[gender as string] || gender;
  }

  // AgeGroup enum을 한글로 변환
  static ageGroupToKorean(ageGroup: AgeGroup | null): string | null {
    if (!ageGroup) return null;

    const ageGroupMap: Record<AgeGroup, string> = {
      [AgeGroup.TEENAGER]: '10대',
      [AgeGroup.TWENTIES]: '20대',
      [AgeGroup.THIRTIES]: '30대',
      [AgeGroup.FORTIES]: '40대',
      [AgeGroup.FIFTIES]: '50대',
      [AgeGroup.SIXTIES]: '60대',
      [AgeGroup.SEVENTIES]: '70대',
      [AgeGroup.EIGHTIES]: '80대',
    };

    return ageGroupMap[ageGroup] || ageGroup;
  }

  // Region enum을 한글로 변환
  static regionToKorean(region: Region | null): string | null {
    if (!region) return null;

    const regionMap: Record<Region, string> = {
      [Region.SEOUL]: '서울',
      [Region.GYEONGGI]: '경기',
      [Region.INCHEON]: '인천',
      [Region.GANGWON]: '강원',
      [Region.CHUNGBUK]: '충북',
      [Region.CHUNGNAM]: '충남',
      [Region.SEJONG]: '세종',
      [Region.DAEJEON]: '대전',
      [Region.JEONBUK]: '전북',
      [Region.JEONNAM]: '전남',
      [Region.GWANGJU]: '광주',
      [Region.GYEONGBUK]: '경북',
      [Region.GYEONGNAM]: '경남',
      [Region.DAEGU]: '대구',
      [Region.ULSAN]: '울산',
      [Region.BUSAN]: '부산',
      [Region.JEJU]: '제주',
    };

    return regionMap[region] || region;
  }
}

// 프론트엔드가 기대하는 응답 구조 (한글로 변환된 값들)
export interface CustomerListResponse {
  currentPage: number;
  totalPages: number;
  totalItemCount: number;
  data: Array<{
    id: number;
    name: string;
    gender: string;
    phoneNumber: string;
    ageGroup: string | null;
    region: string | null;
    email: string;
    memo: string | null;
    contractCount: number;
  }>;
}

export interface CustomerDetailResponse {
  id: number;
  name: string;
  gender: string;
  phoneNumber: string;
  ageGroup: string | null;
  region: string | null;
  email: string;
  memo: string | null;
  contractCount: number;
}

export class CustomerService {
  private readonly customerRepository: CustomerRepository;

  constructor(private readonly prisma: PrismaClient) {
    this.customerRepository = new CustomerRepository(prisma);
  }

  async createCustomer(
    companyId: number,
    data: CreateCustomerDto,
  ): Promise<CustomerDetailResponse> {
    // 이메일 중복 체크 (이제 필수 필드이므로 무조건 체크)
    const emailExists = await this.customerRepository.existsByEmail(companyId, data.email);
    if (emailExists) {
      throw new ConflictError('이미 등록된 이메일입니다.');
    }

    const phoneExists = await this.customerRepository.existsByPhoneNumber(
      companyId,
      data.phoneNumber,
    );
    if (phoneExists) {
      throw new ConflictError('이미 등록된 연락처입니다.');
    }

    const customer = await this.customerRepository.create(companyId, data);

    return {
      id: customer.id,
      name: customer.name,
      gender: EnumConverter.genderToKorean(customer.gender)!, // 한글로 변환
      phoneNumber: customer.phoneNumber,
      ageGroup: EnumConverter.ageGroupToKorean(customer.ageGroup), // 한글로 변환
      region: EnumConverter.regionToKorean(customer.region), // 한글로 변환
      email: customer.email!,
      memo: customer.memo,
      contractCount: customer.contractCount,
    };
  }

  async getCustomerList(
    companyId: number,
    page: number = 1,
    pageSize: number = 8,
    searchBy?: string,
    keyword?: string,
  ): Promise<CustomerListResponse> {
    const { customers, total } = await this.customerRepository.findMany(
      companyId,
      page,
      pageSize,
      keyword,
      searchBy,
    );

    return {
      currentPage: page,
      totalPages: Math.ceil(total / pageSize),
      totalItemCount: total,
      data: customers.map((customer) => ({
        id: customer.id,
        name: customer.name,
        gender: EnumConverter.genderToKorean(customer.gender)!, // 한글로 변환
        phoneNumber: customer.phoneNumber,
        ageGroup: EnumConverter.ageGroupToKorean(customer.ageGroup), // 한글로 변환
        region: EnumConverter.regionToKorean(customer.region), // 한글로 변환
        email: customer.email!,
        memo: customer.memo,
        contractCount: customer.contractCount,
      })),
    };
  }

  async getCustomerById(companyId: number, customerId: number): Promise<CustomerDetailResponse> {
    const customer = await this.customerRepository.findById(companyId, customerId);

    if (!customer) {
      throw new NotFoundError('존재하지 않는 고객입니다.');
    }

    return {
      id: customer.id,
      name: customer.name,
      gender: EnumConverter.genderToKorean(customer.gender)!, // 한글로 변환
      phoneNumber: customer.phoneNumber,
      ageGroup: EnumConverter.ageGroupToKorean(customer.ageGroup), // 한글로 변환
      region: EnumConverter.regionToKorean(customer.region), // 한글로 변환
      email: customer.email!,
      memo: customer.memo,
      contractCount: customer.contractCount,
    };
  }

  async updateCustomer(
    companyId: number,
    customerId: number,
    data: UpdateCustomerDto,
  ): Promise<CustomerDetailResponse> {
    const customer = await this.customerRepository.findById(companyId, customerId);

    if (!customer) {
      throw new NotFoundError('존재하지 않는 고객입니다.');
    }

    // 이메일 중복 체크
    if (data.email && data.email !== customer.email) {
      const emailExists = await this.customerRepository.existsByEmail(
        companyId,
        data.email,
        customerId,
      );
      if (emailExists) {
        throw new ConflictError('이미 등록된 이메일입니다.');
      }
    }

    // 연락처 중복 체크
    if (data.phoneNumber && data.phoneNumber !== customer.phoneNumber) {
      const phoneExists = await this.customerRepository.existsByPhoneNumber(
        companyId,
        data.phoneNumber,
        customerId,
      );
      if (phoneExists) {
        throw new ConflictError('이미 등록된 연락처입니다.');
      }
    }

    const updatedCustomer = await this.customerRepository.update(companyId, customerId, data);

    return {
      id: updatedCustomer.id,
      name: updatedCustomer.name,
      gender: EnumConverter.genderToKorean(updatedCustomer.gender)!, // 한글로 변환
      phoneNumber: updatedCustomer.phoneNumber,
      ageGroup: EnumConverter.ageGroupToKorean(updatedCustomer.ageGroup), // 한글로 변환
      region: EnumConverter.regionToKorean(updatedCustomer.region), // 한글로 변환
      email: updatedCustomer.email!,
      memo: updatedCustomer.memo,
      contractCount: updatedCustomer.contractCount,
    };
  }

  async deleteCustomer(companyId: number, customerId: number): Promise<{ message: string }> {
    const customer = await this.customerRepository.findById(companyId, customerId);

    if (!customer) {
      throw new NotFoundError('존재하지 않는 고객입니다.');
    }

    await this.customerRepository.softDelete(companyId, customerId);

    return { message: '고객 삭제 성공' };
  }

  async uploadCustomers(
    companyId: number,
    userId: number,
    file: Express.Multer.File,
  ): Promise<{ message: string }> {
    // 파일 타입 체크
    if (!file.mimetype.includes('csv') && !file.mimetype.includes('text/csv')) {
      throw new BadRequestError('CSV 파일만 업로드 가능합니다.');
    }

    // Upload 레코드 생성
    const upload = await this.prisma.upload.create({
      data: {
        companyId,
        userId,
        fileName: file.originalname,
        fileUrl: '', // fileUrl은 필수 필드인데 빠져있음. 적절한 값 설정 필요
        fileType: UploadType.CUSTOMER, // enum 사용
        status: UploadStatus.PROCESSING, // enum 사용
      },
    });

    try {
      const customers = await this.parseCSV(file.buffer);

      // 트랜잭션을 사용한 대량 등록
      const result = await this.prisma.$transaction(async (tx) => {
        const repository = new CustomerRepository(tx as PrismaClient);

        // 유효성 검사 및 중복 체크
        const validCustomers: CreateCustomerDto[] = [];
        let failedCount = 0;

        for (const customer of customers) {
          try {
            // 중복 체크
            if (customer.email) {
              const emailExists = await repository.existsByEmail(companyId, customer.email);
              if (emailExists) {
                failedCount++;
                continue;
              }
            }

            const phoneExists = await repository.existsByPhoneNumber(
              companyId,
              customer.phoneNumber,
            );
            if (phoneExists) {
              failedCount++;
              continue;
            }

            validCustomers.push(customer);
          } catch (error) {
            failedCount++;
          }
        }

        // 대량 등록
        const createResult = await repository.createMany(companyId, validCustomers);

        return {
          total: customers.length,
          success: createResult.count,
          failed: failedCount,
        };
      });

      // Upload 상태 업데이트
      await this.prisma.upload.update({
        where: { id: upload.id },
        data: {
          status: UploadStatus.COMPLETED, // enum 사용
          totalRecords: result.total,
          processedRecords: result.total,
          successRecords: result.success,
          failedRecords: result.failed,
        },
      });

      return { message: '업로드가 완료되었습니다.' };
    } catch (error) {
      // 실패 시 Upload 상태 업데이트
      await this.prisma.upload.update({
        where: { id: upload.id },
        data: {
          status: UploadStatus.FAILED, // enum 사용
          errorMessage: error instanceof Error ? error.message : '알 수 없는 오류가 발생했습니다.',
        },
      });

      throw error;
    }
  }

  private parseCSV(buffer: Buffer): Promise<CreateCustomerDto[]> {
    return new Promise((resolve, reject) => {
      const customers: CreateCustomerDto[] = [];
      const stream = Readable.from(buffer);

      stream
        .pipe(
          parse({
            columns: true,
            skip_empty_lines: true,
            trim: true,
          }),
        )
        .on('data', (row: Record<string, any>) => {
          const customer: CreateCustomerDto = {
            name: row.name || row['고객명'],
            gender: row.gender || row['성별'],
            phoneNumber: row.phoneNumber || row['연락처'],
            ageGroup: row.ageGroup || row['연령대'],
            region: row.region || row['지역'],
            email: row.email || row['이메일'],
            memo: row.memo || row['메모'],
          };

          // 필수 필드 체크
          if (customer.name && customer.phoneNumber && customer.gender && customer.email) {
            customers.push(customer);
          }
        })
        .on('end', () => resolve(customers))
        .on('error', (error: Error) => reject(error));
    });
  }
}
