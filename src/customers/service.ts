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
// 분리된 converter 함수들을 import
import {
  genderToKorean,
  ageGroupToKorean,
  regionToKorean,
} from '../common/utils/customer.converter';

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
      gender: genderToKorean(customer.gender)!, // 함수 직접 호출
      phoneNumber: customer.phoneNumber,
      ageGroup: ageGroupToKorean(customer.ageGroup), // 함수 직접 호출
      region: regionToKorean(customer.region), // 함수 직접 호출
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
      searchBy,
      keyword,
    );

    return {
      currentPage: page,
      totalPages: Math.ceil(total / pageSize),
      totalItemCount: total,
      data: customers.map((customer) => ({
        id: customer.id,
        name: customer.name,
        gender: genderToKorean(customer.gender)!, // 함수 직접 호출
        phoneNumber: customer.phoneNumber,
        ageGroup: ageGroupToKorean(customer.ageGroup), // 함수 직접 호출
        region: regionToKorean(customer.region), // 함수 직접 호출
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
      gender: genderToKorean(customer.gender)!, // 함수 직접 호출
      phoneNumber: customer.phoneNumber,
      ageGroup: ageGroupToKorean(customer.ageGroup), // 함수 직접 호출
      region: regionToKorean(customer.region), // 함수 직접 호출
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
      gender: genderToKorean(updatedCustomer.gender)!, // 함수 직접 호출
      phoneNumber: updatedCustomer.phoneNumber,
      ageGroup: ageGroupToKorean(updatedCustomer.ageGroup), // 함수 직접 호출
      region: regionToKorean(updatedCustomer.region), // 함수 직접 호출
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

  /**
   * CSV 대용량 업로드 (트랜잭션 유지)
   * - 트랜잭션 옵션: timeout/maxWait 적용
   * - 중복 체크: 벌크 조회 2회 + 메모리 필터
   * - 쓰기: createMany (대량이면 배치)
   */
  async uploadCustomers(
    companyId: number,
    userId: number,
    file: Express.Multer.File,
  ): Promise<{ message: string }> {
    console.log('📁 파일 업로드 시작:', file.originalname, file.mimetype);

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
        fileUrl: `uploads/${file.originalname}`,
        fileType: UploadType.CUSTOMER,
        status: UploadStatus.PROCESSING,
      },
    });
    console.log('📝 Upload 레코드 생성됨:', upload.id);

    try {
      const customers = await this.parseCSV(file.buffer);
      console.log('📊 파싱된 고객 수:', customers.length);
      console.log('📋 첫 번째 고객 데이터 샘플:', customers[0]);
      if (customers.length === 0) {
        throw new BadRequestError('파싱된 고객 데이터가 없습니다. CSV 형식을 확인해주세요.');
      }

      // ⬇️ 트랜잭션 유지 + timeout/maxWait 적용 + 벌크 조회 → 메모리 필터 → 배치 createMany
      const txResult = await this.prisma.$transaction(
        async (tx) => {
          const repository = new CustomerRepository(tx);

          // 1) 기존값 벌크 조회 (2쿼리)
          const emails = customers.map((c) => c.email!).filter(Boolean);
          const phones = customers.map((c) => c.phoneNumber);

          const [existingByEmail, existingByPhone] = await Promise.all([
            tx.customer.findMany({
              where: { companyId, deletedAt: null, email: { in: emails } },
              select: { email: true },
            }),
            tx.customer.findMany({
              where: { companyId, deletedAt: null, phoneNumber: { in: phones } },
              select: { phoneNumber: true },
            }),
          ]);

          const emailSet = new Set<string>(existingByEmail.map((e) => e.email));
          const phoneSet = new Set<string>(existingByPhone.map((p) => p.phoneNumber));

          // 2) 메모리 필터 (업로드 내 중복도 방지)
          const validCustomers: CreateCustomerDto[] = [];
          let failedCount = 0;

          for (const c of customers) {
            const missing = !c.name || !c.gender || !c.phoneNumber || !c.email;
            const dup = emailSet.has(c.email!) || phoneSet.has(c.phoneNumber);
            if (missing || dup) {
              failedCount += 1;
              continue;
            }
            emailSet.add(c.email!);
            phoneSet.add(c.phoneNumber);
            validCustomers.push(c);
          }

          if (validCustomers.length === 0) {
            throw new BadRequestError('유효한 고객 데이터가 없습니다.');
          }

          // 3) 대량 등록 (배치 처리 권장)
          const BATCH = 1000; // 필요 시 조정
          let createdCount = 0;

          for (let i = 0; i < validCustomers.length; i += BATCH) {
            const slice = validCustomers.slice(i, i + BATCH);
            const createRes = await repository.createMany(companyId, slice); // repo는 tx 기반
            createdCount += createRes.count;
          }

          return {
            total: customers.length,
            success: createdCount,
            failed: failedCount,
          };
        },
        {
          timeout: 20_000, // ⏱ 트랜잭션 최대 실행시간
          maxWait: 20_000, // ⏳ 커넥션 획득 대기시간
          // isolationLevel: 'ReadCommitted', // (선택) 필요 시 지정
        },
      );

      // Upload 상태 업데이트 (성공)
      await this.prisma.upload.update({
        where: { id: upload.id },
        data: {
          status: UploadStatus.COMPLETED,
          totalRecords: txResult.total,
          processedRecords: txResult.success + txResult.failed, // 의미 명확
          successRecords: txResult.success,
          failedRecords: txResult.failed,
        },
      });

      console.log('🎉 업로드 완료:', txResult);
      return {
        message: `업로드가 완료되었습니다. 총 ${txResult.total}개 중 ${txResult.success}개 성공, ${txResult.failed}개 실패`,
      };
    } catch (error) {
      console.error('❌ 업로드 실패:', error);

      // 실패 시 Upload 상태 업데이트
      await this.prisma.upload.update({
        where: { id: upload.id },
        data: {
          status: UploadStatus.FAILED,
          errorMessage: error instanceof Error ? error.message : '알 수 없는 오류가 발생했습니다.',
        },
      });

      throw error;
    }
  }

  // parseCSV 메서드 개선
  private parseCSV(buffer: Buffer): Promise<CreateCustomerDto[]> {
    return new Promise((resolve, reject) => {
      const customers: CreateCustomerDto[] = [];
      const stream = Readable.from(buffer);

      console.log('📄 CSV 파싱 시작...');

      stream
        .pipe(
          parse({
            columns: true,
            skip_empty_lines: true,
            trim: true,
            encoding: 'utf8', // 인코딩 명시
          }),
        )
        .on('data', (row: Record<string, any>) => {
          console.log('📋 원본 row 데이터:', row);

          // 키를 정규화하여 매핑 (공백, 특수문자 제거)
          const normalizedRow: Record<string, any> = {};
          Object.entries(row).forEach(([key, value]) => {
            const normalizedKey = key.trim().replace(/\s+/g, '');
            normalizedRow[normalizedKey] = value;
          });

          console.log('🔄 정규화된 row 데이터:', normalizedRow);

          // 컬럼명 매핑 (정규화된 키 사용)
          const name =
            normalizedRow['고객명'] ||
            normalizedRow['name'] ||
            normalizedRow['이름'] ||
            normalizedRow['Name'] ||
            row['고객명'];
          const genderRaw =
            normalizedRow['성별'] ||
            normalizedRow['gender'] ||
            normalizedRow['Gender'] ||
            row['성별'];
          const phoneNumber =
            normalizedRow['연락처'] ||
            normalizedRow['phoneNumber'] ||
            normalizedRow['전화번호'] ||
            normalizedRow['Phone'] ||
            row['연락처'];
          const ageGroupRaw =
            normalizedRow['연령대'] ||
            normalizedRow['ageGroup'] ||
            normalizedRow['나이'] ||
            normalizedRow['Age'] ||
            row['연령대'];
          const regionRaw =
            normalizedRow['지역'] ||
            normalizedRow['region'] ||
            normalizedRow['Region'] ||
            row['지역'];
          const email =
            normalizedRow['이메일'] ||
            normalizedRow['email'] ||
            normalizedRow['Email'] ||
            row['이메일'];
          const memo =
            normalizedRow['메모'] || normalizedRow['memo'] || normalizedRow['Memo'] || row['메모'];

          console.log('🔄 매핑된 데이터:', {
            name,
            genderRaw,
            phoneNumber,
            ageGroupRaw,
            regionRaw,
            email,
            memo,
          });

          // 필수 필드 체크
          if (!name || !genderRaw || !phoneNumber || !email) {
            console.log('❌ 필수 필드 누락:', { name, genderRaw, phoneNumber, email });
            return;
          }

          // Gender 처리 - Prisma enum 값으로 직접 매핑
          let gender: Gender;
          const genderStr = String(genderRaw).trim().toUpperCase();
          if (genderStr === 'MALE' || genderStr === '남성' || genderStr === 'M') {
            gender = Gender.MALE; // 올바른 enum 값 사용
          } else if (genderStr === 'FEMALE' || genderStr === '여성' || genderStr === 'F') {
            gender = Gender.FEMALE; // 올바른 enum 값 사용
          } else {
            console.log('❌ 유효하지 않은 성별:', genderRaw);
            return;
          }

          // AgeGroup 처리 - Prisma enum 값으로 직접 매핑
          let ageGroup: AgeGroup | undefined;
          if (ageGroupRaw) {
            const ageStr = String(ageGroupRaw).trim().toUpperCase();
            // CSV의 영문 값을 Prisma enum으로 매핑
            switch (ageStr) {
              case 'TEENAGER':
                ageGroup = AgeGroup.TEENAGER;
                break;
              case 'TWENTIES':
                ageGroup = AgeGroup.TWENTIES;
                break;
              case 'THIRTIES':
                ageGroup = AgeGroup.THIRTIES;
                break;
              case 'FORTIES':
                ageGroup = AgeGroup.FORTIES;
                break;
              case 'FIFTIES':
                ageGroup = AgeGroup.FIFTIES;
                break;
              case 'SIXTIES':
                ageGroup = AgeGroup.SIXTIES;
                break;
              case 'SEVENTIES':
                ageGroup = AgeGroup.SEVENTIES;
                break;
              case 'EIGHTIES':
                ageGroup = AgeGroup.EIGHTIES;
                break;
              case '10대':
                ageGroup = AgeGroup.TEENAGER;
                break;
              case '20대':
                ageGroup = AgeGroup.TWENTIES;
                break;
              case '30대':
                ageGroup = AgeGroup.THIRTIES;
                break;
              case '40대':
                ageGroup = AgeGroup.FORTIES;
                break;
              case '50대':
                ageGroup = AgeGroup.FIFTIES;
                break;
              case '60대':
                ageGroup = AgeGroup.SIXTIES;
                break;
              case '70대':
                ageGroup = AgeGroup.SEVENTIES;
                break;
              case '80대':
                ageGroup = AgeGroup.EIGHTIES;
                break;
              default:
                console.log('❌ 유효하지 않은 연령대:', ageGroupRaw);
                break;
            }
          }

          // Region 처리 - Prisma enum 값으로 직접 매핑
          let region: Region | undefined;
          if (regionRaw) {
            const regionStr = String(regionRaw).trim().toUpperCase();
            // CSV의 영문 값을 Prisma enum으로 매핑
            switch (regionStr) {
              case 'SEOUL':
                region = Region.SEOUL;
                break;
              case 'GYEONGGI':
                region = Region.GYEONGGI;
                break;
              case 'INCHEON':
                region = Region.INCHEON;
                break;
              case 'GANGWON':
                region = Region.GANGWON;
                break;
              case 'CHUNGBUK':
                region = Region.CHUNGBUK;
                break;
              case 'CHUNGNAM':
                region = Region.CHUNGNAM;
                break;
              case 'SEJONG':
                region = Region.SEJONG;
                break;
              case 'DAEJEON':
                region = Region.DAEJEON;
                break;
              case 'JEONBUK':
                region = Region.JEONBUK;
                break;
              case 'JEONNAM':
                region = Region.JEONNAM;
                break;
              case 'GWANGJU':
                region = Region.GWANGJU;
                break;
              case 'GYEONGBUK':
                region = Region.GYEONGBUK;
                break;
              case 'GYEONGNAM':
                region = Region.GYEONGNAM;
                break;
              case 'DAEGU':
                region = Region.DAEGU;
                break;
              case 'ULSAN':
                region = Region.ULSAN;
                break;
              case 'BUSAN':
                region = Region.BUSAN;
                break;
              case 'JEJU':
                region = Region.JEJU;
                break;
              case '서울':
                region = Region.SEOUL;
                break;
              case '경기':
                region = Region.GYEONGGI;
                break;
              case '인천':
                region = Region.INCHEON;
                break;
              case '강원':
                region = Region.GANGWON;
                break;
              case '충북':
                region = Region.CHUNGBUK;
                break;
              case '충남':
                region = Region.CHUNGNAM;
                break;
              case '세종':
                region = Region.SEJONG;
                break;
              case '대전':
                region = Region.DAEJEON;
                break;
              case '전북':
                region = Region.JEONBUK;
                break;
              case '전남':
                region = Region.JEONNAM;
                break;
              case '광주':
                region = Region.GWANGJU;
                break;
              case '경북':
                region = Region.GYEONGBUK;
                break;
              case '경남':
                region = Region.GYEONGNAM;
                break;
              case '대구':
                region = Region.DAEGU;
                break;
              case '울산':
                region = Region.ULSAN;
                break;
              case '부산':
                region = Region.BUSAN;
                break;
              case '제주':
                region = Region.JEJU;
                break;
              default:
                console.log('❌ 유효하지 않은 지역:', regionRaw);
                break;
            }
          }

          const customer: CreateCustomerDto = {
            name: String(name).trim(),
            gender,
            phoneNumber: String(phoneNumber).trim(),
            ageGroup,
            region,
            email: String(email).trim(),
            memo: memo ? String(memo).trim() : undefined,
          };

          console.log('✅ 파싱된 고객:', customer);
          customers.push(customer);
        })
        .on('end', () => {
          console.log('📊 CSV 파싱 완료. 총 파싱된 고객 수:', customers.length);
          resolve(customers);
        })
        .on('error', (error: Error) => {
          console.error('❌ CSV 파싱 오류:', error);
          reject(error);
        });
    });
  }
}
