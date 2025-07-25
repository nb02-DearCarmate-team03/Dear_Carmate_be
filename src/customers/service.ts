/* eslint-disable */
import { PrismaClient, Prisma } from '@prisma/client';
import { parse } from 'csv-parse';
import { Readable } from 'stream';
import { CustomerRepository } from './repository';
import { CreateCustomerDto, UpdateCustomerDto } from './dto/customer.dto';
import { NotFoundError, BadRequestError, ConflictError } from '../middlewares/error.middleware';

export interface CustomerListResponse {
  customers: Array<{
    id: number;
    name: string;
    gender: string | null;
    phoneNumber: string;
    ageGroup: string | null;
    region: string | null;
    email: string | null;
    memo: string | null;
    contractCount: number;
  }>;
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export class CustomerService {
  private readonly customerRepository: CustomerRepository;

  constructor(private readonly prisma: PrismaClient) {
    this.customerRepository = new CustomerRepository(prisma);
  }

  async createCustomer(companyId: number, data: CreateCustomerDto) {
    // 중복 체크
    if (data.email) {
      const emailExists = await this.customerRepository.existsByEmail(companyId, data.email);
      if (emailExists) {
        throw new Error('이미 등록된 이메일입니다.');
      }
    }

    const phoneExists = await this.customerRepository.existsByPhoneNumber(
      companyId,
      data.phoneNumber,
    );
    if (phoneExists) {
      throw new Error('이미 등록된 연락처입니다.');
    }

    const customer = await this.customerRepository.create(companyId, data);

    return {
      id: customer.id,
      name: customer.name,
      gender: customer.gender,
      phoneNumber: customer.phoneNumber,
      ageGroup: customer.ageGroup,
      region: customer.region,
      email: customer.email,
      memo: customer.memo,
      contractCount: customer.contractCount,
    };
  }

  async getCustomerList(
    companyId: number,
    // eslint-disable-next-line default-param-last
    page: number = 1,
    // eslint-disable-next-line default-param-last
    limit: number = 10,
    search?: string,
  ): Promise<CustomerListResponse> {
    const { customers, total } = await this.customerRepository.findMany(
      companyId,
      page,
      limit,
      search,
    );

    return {
      customers: customers.map((customer) => ({
        id: customer.id,
        name: customer.name,
        gender: customer.gender,
        phoneNumber: customer.phoneNumber,
        ageGroup: customer.ageGroup,
        region: customer.region,
        email: customer.email,
        memo: customer.memo,
        contractCount: customer.contractCount,
      })),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getCustomerById(companyId: number, customerId: number) {
    const customer = await this.customerRepository.findById(companyId, customerId);

    if (!customer) {
      throw new Error('존재하지 않는 고객입니다.');
    }

    return {
      id: customer.id,
      name: customer.name,
      gender: customer.gender,
      phoneNumber: customer.phoneNumber,
      ageGroup: customer.ageGroup,
      region: customer.region,
      email: customer.email,
      memo: customer.memo,
      contractCount: customer.contractCount,
    };
  }

  async updateCustomer(companyId: number, customerId: number, data: UpdateCustomerDto) {
    const customer = await this.customerRepository.findById(companyId, customerId);

    if (!customer) {
      throw new Error('존재하지 않는 고객입니다.');
    }

    // 이메일 중복 체크
    if (data.email && data.email !== customer.email) {
      const emailExists = await this.customerRepository.existsByEmail(
        companyId,
        data.email,
        customerId,
      );
      if (emailExists) {
        throw new Error('이미 등록된 이메일입니다.');
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
        throw new Error('이미 등록된 연락처입니다.');
      }
    }

    const updatedCustomer = await this.customerRepository.update(companyId, customerId, data);

    return {
      id: updatedCustomer.id,
      name: updatedCustomer.name,
      gender: updatedCustomer.gender,
      phoneNumber: updatedCustomer.phoneNumber,
      ageGroup: updatedCustomer.ageGroup,
      region: updatedCustomer.region,
      email: updatedCustomer.email,
      memo: updatedCustomer.memo,
      contractCount: updatedCustomer.contractCount,
    };
  }

  async deleteCustomer(companyId: number, customerId: number) {
    const customer = await this.customerRepository.findById(companyId, customerId);

    if (!customer) {
      throw new Error('존재하지 않는 고객입니다.');
    }

    await this.customerRepository.softDelete(companyId, customerId);

    return { message: '고객 삭제 성공' };
  }

  async uploadCustomers(companyId: number, userId: number, file: Express.Multer.File) {
    // 파일 타입 체크
    if (!file.mimetype.includes('csv') && !file.mimetype.includes('text/csv')) {
      throw new Error('CSV 파일만 업로드 가능합니다.');
    }

    // Upload 레코드 생성
    const upload = await this.prisma.upload.create({
      data: {
        companyId,
        userId,
        fileName: file.originalname,
        fileType: 'CUSTOMER',
        status: 'PROCESSING',
      },
    });

    try {
      const customers = await this.parseCSV(file.buffer);

      // 트랜잭션을 사용한 대량 등록
      const result = await this.prisma.$transaction(async (tx) => {
        const repository = new CustomerRepository(tx);

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
          status: 'COMPLETED',
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
          status: 'FAILED',
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
          if (customer.name && customer.phoneNumber) {
            customers.push(customer);
          }
        })
        .on('end', () => resolve(customers))
        .on('error', (error: Error) => reject(error));
    });
  }
}
