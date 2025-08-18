import { NextFunction, Request, Response } from 'express';
import { plainToInstance } from 'class-transformer';
import { AuthRequest } from 'src/middlewares/auth.middleware';
import { CreateCarDTO } from './dto/create-car.dto';
import CarService, { CarModelListResponseDto } from './service';
import { CarListQueryDto } from './dto/get-car.dto';
import { UpdateCarDto } from './dto/update-car.dto';
import { BadRequestError } from '../common/errors/bad-request-error';
import { UnauthorizedError } from '../common/errors/unauthorized-error';

export default class CarController {
  private readonly carService: CarService;

  constructor(carService: CarService) {
    this.carService = carService;
  }

  createCar = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const data: CreateCarDTO = req.body;
      const companyId = Number(req.user?.companyId);

      if (!companyId) {
        throw new UnauthorizedError('권한이 없습니다.');
      }

      const newCar = await this.carService.createCar(data, companyId);
      res.status(201).json(newCar);
    } catch (error) {
      next(error);
    }
  };

  getCarList = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const query = plainToInstance(CarListQueryDto, req.query);
      const companyId = req.user?.companyId;

      if (!companyId) {
        return res.status(401).json({ message: '인증되지 않은 사용자입니다.' });
      }
      const carList = await this.carService.getCarList(query, companyId);
      return res.status(200).json(carList);
    } catch (error) {
      return next(error);
    }
  };

  updateCar = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const carId = Number(req.params.carId);
      const data: UpdateCarDto = req.body;
      const companyId = Number(req.user?.companyId);

      if (!companyId) {
        throw new UnauthorizedError('권한이 없습니다.');
      }

      const updatedCar = await this.carService.updateCar(data, companyId, carId);
      res.status(200).json(updatedCar);
    } catch (error) {
      next(error);
    }
  };

  deleteCar = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const carId = Number(req.params.carId);
      const companyId = Number(req.user?.companyId);

      if (!companyId) {
        throw new UnauthorizedError('권한이 없습니다.');
      }

      const result = await this.carService.deleteCar(carId, companyId);
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  };

  getCarDetails = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const carId = Number(req.params.carId);
      const userId = Number(req.user?.id);

      if (!userId) {
        throw new UnauthorizedError('로그인이 필요합니다.');
      }

      const carDetails = await this.carService.getCarDetails(carId, userId);
      res.status(200).json(carDetails);
    } catch (error) {
      next(error);
    }
  };

  uploadCars = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.file) {
        throw new BadRequestError('업로드할 CSV 파일이 필요합니다.');
      }

      if (!req.user?.companyId) {
        throw new UnauthorizedError('업로드 할 수 있는 권한이 없습니다.');
      }

      const authCompanyId = Number(req.user.companyId);

      const result = await this.carService.uploadCars(req.file.buffer, authCompanyId);
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  };

  getCarModelList = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const carModelList: CarModelListResponseDto = await this.carService.getCarModelList();
      res.status(200).json(carModelList);
    } catch (error) {
      next(error);
    }
  };
}
