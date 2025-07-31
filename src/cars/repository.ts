import { Prisma, PrismaClient } from '@prisma/client';
import { FindManyCarOptions } from './dto/get-car.dto';

export default class CarRepository {
  private readonly prisma: PrismaClient | Prisma.TransactionClient;

  constructor(prisma: PrismaClient | Prisma.TransactionClient) {
    this.prisma = prisma;
  }

  async create(data: Prisma.CarCreateInput) {
    return this.prisma.car.create({
      data,
    });
  }

  async findById(carId: number) {
    return this.prisma.car.findUnique({
      where: { id: carId },
    });
  }

  async findByCarNumber(companyId: number, carNumber: string) {
    return this.prisma.car.findUnique({
      where: {
        companyId_carNumber: {
          companyId,
          carNumber,
        },
      },
    });
  }

  async findManyCar(options: FindManyCarOptions) {
    return this.prisma.car.findMany({
      skip: options.skip ?? 0,
      take: options.take ?? 0,
      where: options.where ?? {},
      orderBy: options.orderBy || { id: 'asc' },
    });
  }

  async countCars(where?: Prisma.CarWhereInput): Promise<number> {
    return this.prisma.car.count({ where });
  }

  async update(carId: number, data: Prisma.CarUpdateInput) {
    return this.prisma.car.update({
      where: { id: carId },
      data,
    });
  }

  async delete(carId: number, companyId: number) {
    return this.prisma.car.delete({
      where: {
        id: carId,
        companyId,
      },
    });
  }

  async createMany(data: Prisma.CarCreateManyInput[]): Promise<Prisma.BatchPayload> {
    return this.prisma.car.createMany({
      data,
      skipDuplicates: true, // 중복된 레코드 건너뛰기
    });
  }

  async findManyCarModel(): Promise<Array<{ manufacturer: string; model: string }>> {
    return this.prisma.car.findMany({
      select: {
        manufacturer: true,
        model: true,
      },
      distinct: ['manufacturer', 'model'], // 제조사, 모델 조합 중복 방지
      orderBy: [{ manufacturer: 'asc' }, { model: 'asc' }],
    });
  }
}
