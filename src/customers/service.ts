/* eslint-disable */
import { PrismaClient, Prisma, UploadType, UploadStatus } from '@prisma/client';
import { parse } from 'csv-parse';
import { Readable } from 'stream';
import { CustomerRepository } from './repository';
import { CreateCustomerDto } from './dto/create-customer.dto';
import { UpdateCustomerDto } from './dto/update-customer.dto';
import { ConflictError } from '../common/errors/conflict-error';
import { NotFoundError } from '../common/errors/not-found-error';
import { BadRequestError } from '../common/errors/bad-request-error';

export interface CustomerListResponse {
  currentPage: number;
  totalPages: number;
  totalItemCount: number;
  customers: Array<{
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
      gender: customer.gender!, // DB에서는 nullable이지만 생성 시에는 필수
      phoneNumber: customer.phoneNumber,
      ageGroup: customer.ageGroup,
      region: customer.region,
      email: customer.email!, // DB에서는 nullable이지만 생성 시에는 필수
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
      customers: customers.map((customer) => ({
        id: customer.id,
        name: customer.name,
        gender: customer.gender!, // 기존 데이터는 null일 수 있지만 새 데이터는 필수
        phoneNumber: customer.phoneNumber,
        ageGroup: customer.ageGroup,
        region: customer.region,
        email: customer.email!, // 기존 데이터는 null일 수 있지만 새 데이터는 필수
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
      gender: customer.gender!, // 기존 데이터는 null일 수 있지만 응답에서는 필수
      phoneNumber: customer.phoneNumber,
      ageGroup: customer.ageGroup,
      region: customer.region,
      email: customer.email!, // 기존 데이터는 null일 수 있지만 응답에서는 필수
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
      gender: updatedCustomer.gender!, // 기존 데이터는 null일 수 있지만 응답에서는 필수
      phoneNumber: updatedCustomer.phoneNumber,
      ageGroup: updatedCustomer.ageGroup,
      region: updatedCustomer.region,
      email: updatedCustomer.email!, // 기존 데이터는 null일 수 있지만 응답에서는 필수
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
        fileUrl: 'https://placeholder.url/file.pdf', // fileUrl은 필수 필드인데 빠져있음. 적절한 값 설정 필요
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
