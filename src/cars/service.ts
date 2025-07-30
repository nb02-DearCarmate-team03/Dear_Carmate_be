import { Prisma, CarType, CarStatus } from '@prisma/client';
import { parse } from 'csv-parse';
import {
  AppError,
  BadRequestError,
  ConflictError,
  ForbiddenError,
  NotFoundError,
  UnauthorizedError,
} from 'src/middlewares/error.middleware';
import { Readable } from 'stream';
import { validate } from 'class-validator';
import { plainToInstance } from 'class-transformer';
import { CarResponseDto, CreateCarDTO } from './dto/create-car.dto';
import CarRepository from './repository';
import { CarListQueryDto, CarListResponseDto, FindManyCarOptions } from './dto/get-car.dto';
import { UpdateCarDto } from './dto/update-car.dto';
import { UploadCarDto } from './dto/upload-car.dto';

const BATCH_SIZE = 1000;

export interface CarModelOfManufacturer {
  manufacturer: string;
  model: string[];
}

export interface CarModelListResponseDto {
  data: CarModelOfManufacturer[];
}

export default class CarService {
  private readonly carRepository: CarRepository;

  constructor(carRepository: CarRepository) {
    this.carRepository = carRepository;
  }

  async createCar(data: CreateCarDTO, companyId: number): Promise<CarResponseDto> {
    // 차량 번호 중복 체크
    const existingCar = await this.carRepository.findByCarNumber(companyId, data.carNumber);
    if (existingCar) {
      throw new ConflictError('이미 존재하는 차량 번호입니다.');
    }

    // 차량 유형 매핑
    let prismaCarType: CarType;
    switch (data.type) {
      case '경·소형':
        prismaCarType = CarType.COMPACT;
        break;
      case '준중·중형':
        prismaCarType = CarType.MIDSIZE;
        break;
      case '대형':
        prismaCarType = CarType.FULLSIZE;
        break;
      case '스포츠카':
        prismaCarType = CarType.SPORTS;
        break;
      case 'SUV':
        prismaCarType = CarType.SUV;
        break;
      default:
        throw new BadRequestError(`유효하지 않은 차량 유형: ${data.type}`);
    }

    const newCar = await this.carRepository.create({
      ...data,
      type: prismaCarType,
      company: {
        connect: { id: companyId },
      },
    });

    return {
      id: newCar.id,
      carNumber: newCar.carNumber,
      manufacturer: newCar.manufacturer,
      model: newCar.model,
      type: newCar.type as '경·소형' | '준중·중형' | '대형' | 'SUV' | '스포츠카',
      manufacturingYear: newCar.manufacturingYear,
      mileage: newCar.mileage,
      price: newCar.price.toNumber(),
      accidentCount: newCar.accidentCount,
      explanation: newCar.explanation,
      accidentDetails: newCar.accidentDetails,
      status: newCar.status as 'possession' | 'contractProceeding' | 'contractCompleted',
    };
  }

  async gerCarList(query: CarListQueryDto): Promise<CarListResponseDto> {
    const { page, pageSize, status, searchBy, keyword } = query;
    const skip = (page - 1) * pageSize;
    const take = pageSize;

    const whereClause: Prisma.CarWhereInput = {};

    // 차량 상태 필터링
    if (status) {
      whereClause.status = status as CarStatus;
    }

    // 검색 기준, 검색어 필터링
    if (searchBy && keyword) {
      if (searchBy === 'carNumber') {
        whereClause.carNumber = {
          contains: keyword,
          mode: 'insensitive',
        };
      } else if (searchBy === 'model') {
        whereClause.model = {
          contains: keyword,
          mode: 'insensitive',
        };
      }
    }
    const findOptions: FindManyCarOptions = {
      skip,
      take,
      where: whereClause,
      orderBy: { id: 'asc' },
    };

    const totalItemCount = await this.carRepository.countCars(whereClause);
    const cars = await this.carRepository.findManyCar(findOptions);

    const carOutputData: CarResponseDto[] = cars.map((car) => ({
      id: car.id,
      carNumber: car.carNumber,
      manufacturer: car.manufacturer,
      model: car.model,
      type: car.type as '경·소형' | '준중·중형' | '대형' | 'SUV' | '스포츠카',
      manufacturingYear: car.manufacturingYear,
      mileage: car.mileage,
      price: car.price.toNumber(),
      accidentCount: car.accidentCount,
      explanation: car.explanation,
      accidentDetails: car.accidentDetails,
      status: car.status as 'possession' | 'contractProceeding' | 'contractCompleted',
    }));
    const totalPages = Math.ceil(totalItemCount / pageSize);
    return {
      currentPage: page,
      totalPages,
      totalItemCount,
      data: carOutputData,
    };
  }

  async updateCar(data: UpdateCarDto, companyId: number, carId: number): Promise<CarResponseDto> {
    // 차량 존재 여부 확인
    const existingCar = await this.carRepository.findById(carId);
    if (!existingCar) {
      throw new NotFoundError('존재하지 않는 차량입니다.');
    }

    // 회사 소속 차량인지 확인
    if (existingCar.companyId !== companyId) {
      throw new ForbiddenError('회사에 소속된 차량이 아닙니다.');
    }

    // 업데이트할 데이터 준비
    const updateData: Prisma.CarUpdateInput = {};

    // 차량 번호 중복 체크
    if (data.carNumber !== undefined && data.carNumber !== existingCar.carNumber) {
      const existingCarByNumber = await this.carRepository.findByCarNumber(
        companyId,
        data.carNumber,
      );
      if (existingCarByNumber) {
        throw new ConflictError('이미 존재하는 차량 번호입니다.');
      }
      updateData.carNumber = data.carNumber;
    }

    // 차량 유형 매핑
    if (data.type !== undefined) {
      let prismaCarType: CarType;
      switch (data.type) {
        case '경·소형':
          prismaCarType = CarType.COMPACT;
          break;
        case '준중·중형':
          prismaCarType = CarType.MIDSIZE;
          break;
        case '대형':
          prismaCarType = CarType.FULLSIZE;
          break;
        case '스포츠카':
          prismaCarType = CarType.SPORTS;
          break;
        case 'SUV':
          prismaCarType = CarType.SUV;
          break;
        default:
          throw new BadRequestError(`유효하지 않은 차량 유형: ${data.type}`);
      }
      updateData.type = prismaCarType;
    }

    // 업데이트할 필드가 정의되어 있는 경우에만 추가
    if (data.manufacturer !== undefined) updateData.manufacturer = data.manufacturer;
    if (data.model !== undefined) updateData.model = data.model;
    if (data.manufacturingYear !== undefined) updateData.manufacturingYear = data.manufacturingYear;
    if (data.mileage !== undefined) updateData.mileage = data.mileage;
    if (data.price !== undefined) updateData.price = data.price;
    if (data.accidentCount !== undefined) updateData.accidentCount = data.accidentCount;
    if (data.explanation !== undefined) updateData.explanation = data.explanation;
    if (data.accidentDetails !== undefined) updateData.accidentDetails = data.accidentDetails;

    const updatedCar = await this.carRepository.update(carId, updateData);

    return {
      id: updatedCar.id,
      carNumber: updatedCar.carNumber,
      manufacturer: updatedCar.manufacturer,
      model: updatedCar.model,
      type: updatedCar.type as '경·소형' | '준중·중형' | '대형' | 'SUV' | '스포츠카',
      manufacturingYear: updatedCar.manufacturingYear,
      mileage: updatedCar.mileage,
      price: updatedCar.price.toNumber(),
      accidentCount: updatedCar.accidentCount,
      explanation: updatedCar.explanation,
      accidentDetails: updatedCar.accidentDetails,
      status: updatedCar.status as 'possession' | 'contractProceeding' | 'contractCompleted',
    };
  }

  async deleteCar(carId: number, companyId: number): Promise<{ message: string }> {
    // 차량 존재 여부 확인
    const existingCar = await this.carRepository.findById(carId);
    if (!existingCar) {
      throw new NotFoundError('존재하지 않는 차량입니다.');
    }

    // 회사 소속 차량인지 확인
    if (existingCar.companyId !== companyId) {
      throw new ForbiddenError('회사에 소속된 차량이 아닙니다.');
    }

    await this.carRepository.delete(carId, companyId);
    return { message: '차량 삭제 성공' };
  }

  async getCarDetails(carId: number, userId: number): Promise<CarResponseDto> {
    // 로그인 확인
    if (!userId) {
      throw new UnauthorizedError('로그인이 필요합니다.');
    }
    const detailcar = await this.carRepository.findById(carId);
    if (!detailcar) {
      throw new NotFoundError('존재하지 않는 차량입니다');
    }
    // 차량 정보 반환
    return {
      id: detailcar.id,
      carNumber: detailcar.carNumber,
      manufacturer: detailcar.manufacturer,
      model: detailcar.model,
      type: detailcar.type as '경·소형' | '준중·중형' | '대형' | 'SUV' | '스포츠카',
      manufacturingYear: detailcar.manufacturingYear,
      mileage: detailcar.mileage,
      price: detailcar.price.toNumber(),
      accidentCount: detailcar.accidentCount,
      explanation: detailcar.explanation,
      accidentDetails: detailcar.accidentDetails,
      status: detailcar.status as 'possession' | 'contractProceeding' | 'contractCompleted',
    };
  }

  async uploadCars(fileBuffer: Buffer, authCompanyId: number): Promise<{ message: string }> {
    const recordsToInsert: Prisma.CarCreateManyInput[] = [];
    const failedRecords: any[] = [];
    let totalRecords = 0;

    const parser = parse({
      delimiter: ',',
      columns: true,
      skip_empty_lines: true,
      trim: true,
    });

    const readableStream = Readable.from(fileBuffer);

    return new Promise((resolve, reject) => {
      readableStream
        .pipe(parser)
        .on('data', async (record: any) => {
          totalRecords += 1;

          const carRecordDto = plainToInstance(UploadCarDto, record);
          const errors = await validate(carRecordDto);

          if (errors.length > 0) {
            failedRecords.push({
              lineNumber: totalRecords,
              record,
              errors: errors.map((err) => Object.values(err.constraints || {})).flat(),
            });
            return;
          }

          let prismaCarType: CarType;
          switch (carRecordDto.type) {
            case '경·소형':
              prismaCarType = CarType.COMPACT;
              break;
            case '준중·중형':
              prismaCarType = CarType.MIDSIZE;
              break;
            case '대형':
              prismaCarType = CarType.FULLSIZE;
              break;
            case '스포츠카':
              prismaCarType = CarType.SPORTS;
              break;
            case 'SUV':
              prismaCarType = CarType.SUV;
              break;
            default:
              failedRecords.push({
                lineNumber: totalRecords,
                record,
                errors: [`유효하지 않은 차량 유형: ${carRecordDto.type}`],
              });
              return;
          }
          const existingCar = await this.carRepository.findByCarNumber(
            authCompanyId,
            carRecordDto.carNumber,
          );
          if (existingCar) {
            failedRecords.push({
              lineNumber: totalRecords,
              record,
              errors: [
                `이미 존재하는 차량 번호입니다. (회사 ID: ${authCompanyId}, 차량 번호: ${carRecordDto.carNumber})`,
              ],
            });
            return;
          }
          const carToCreate: Prisma.CarCreateManyInput = {
            carNumber: carRecordDto.carNumber,
            manufacturer: carRecordDto.manufacturer,
            model: carRecordDto.model,
            type: prismaCarType,
            manufacturingYear: carRecordDto.manufacturingYear,
            mileage: carRecordDto.mileage,
            price: new Prisma.Decimal(carRecordDto.price),
            accidentCount: carRecordDto.accidentCount || 0,
            explanation: carRecordDto.explanation,
            accidentDetails: carRecordDto.accidentDetails,
            companyId: authCompanyId, // 회사 ID 추가
          };

          recordsToInsert.push(carToCreate);

          if (recordsToInsert.length >= BATCH_SIZE) {
            parser.pause();
            await this.processBatch(recordsToInsert, failedRecords);
            recordsToInsert.length = 0;
            parser.resume();
          }
        })
        .on('end', async () => {
          if (recordsToInsert.length > 0) {
            await this.processBatch(recordsToInsert, failedRecords);
          }

          let message = 'CSV 파일 처리가 완료되었습니다.';
          if (failedRecords.length > 0) {
            message += ` ${failedRecords.length}개의 레코드 처리에 실패했습니다.`;
            console.warn(`CSV Upload Failed Records for company ${authCompanyId}:`, failedRecords);
          }

          resolve({ message });
        })
        .on('error', (err) => {
          console.error('CSV Parsing Error:', err);
          reject(new AppError(`CSV 파싱 중 오류 발생: ${err.message}`, 500));
        });
    });
  }

  private async processBatch(
    batch: Prisma.CarCreateManyInput[],
    failedRecords: any[],
  ): Promise<void> {
    if (batch.length === 0) {
      return;
    }

    try {
      const result = await this.carRepository.createMany(batch);
      console.log(`Batch inserted: ${result.count} records.`);
    } catch (dbError: any) {
      console.error('Batch DB insertion failed:', dbError);
      batch.forEach((record) => {
        failedRecords.push({
          record,
          errors: [`DB 삽입 실패: ${dbError.message}`],
        });
      });
    }
  }

  async getCarModelList(): Promise<CarModelListResponseDto> {
    // 중복되지 않는 제조사-모델 쌍 가져오기
    const distinctCarPairs = await this.carRepository.findManyCarModel();

    const manufacturerMap = distinctCarPairs.reduce((acc, pair) => {
      const { manufacturer, model } = pair;

      // Map에 해당 제조사가 없으면 빈 배열로 초기화하고, 모델 추가
      if (!acc.has(manufacturer)) {
        acc.set(manufacturer, []);
      }
      acc.get(manufacturer)?.push(model);
      return acc;
    }, new Map<string, string[]>());

    // ResponseDTO 형식으로 변환
    const data: CarModelOfManufacturer[] = Array.from(manufacturerMap.entries()).map(
      ([manufacturer, models]) => ({
        manufacturer,
        model: models.sort(), // 모델 목록을 알파벳 순으로 정렬
      }),
    );

    data.sort((a, b) => a.manufacturer.localeCompare(b.manufacturer));

    return { data };
  }
}
