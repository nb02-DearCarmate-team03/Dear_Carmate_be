import { Prisma, CarType, CarStatus } from '@prisma/client';
import { CarResponseDto, CreateCarDTO } from './dto/create-car.dto';
import CarRepository from './repository';
import { CarListQueryDto, CarListResponseDto, FindManyCarOptions } from './dto/get-car.dto';
import { UpdateCarDto } from './dto/update-car.dto';

export default class CarService {
  private readonly carRepository: CarRepository;

  constructor(carRepository: CarRepository) {
    this.carRepository = carRepository;
  }

  async createCar(data: CreateCarDTO, companyId: number): Promise<CarResponseDto> {
    // 차량 번호 중복 체크
    const existingCar = await this.carRepository.findByCarNumber(companyId, data.carNumber);
    if (existingCar) {
      throw new Error('이미 존재하는 차량 번호입니다.');
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
        throw new Error(`유효하지 않은 차량 유형: ${data.type}`);
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
      throw new Error('존재하지 않는 차량입니다.');
    }

    // 회사 소속 차량인지 확인
    if (existingCar.companyId !== companyId) {
      throw new Error('회사에 소속된 차량이 아닙니다.');
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
        throw new Error('이미 존재하는 차량 번호입니다.');
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
          throw new Error(`유효하지 않은 차량 유형: ${data.type}`);
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
}
