import { NextFunction, Request, Response } from 'express';
import { AuthRequest } from 'src/middlewares/auth.middleware';
import { UnauthorizedError } from 'src/middlewares/error.middleware';
import { CreateCarDTO } from './dto/create-car.dto';
import CarService from './service';
import { CarListQueryDto } from './dto/get-car.dto';
import { UpdateCarDto } from './dto/update-car.dto';

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
      return res.status(201).json(newCar);
    } catch (error) {
      next(error);
      return Promise.resolve();
    }
  };

  getCarList = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const query: CarListQueryDto = req.query as unknown as CarListQueryDto;

      const carList = await this.carService.gerCarList(query);
      return res.status(200).json(carList);
    } catch (error) {
      next(error);
      return Promise.resolve();
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
      return res.status(200).json(updatedCar);
    } catch (error) {
      next(error);
      return Promise.resolve();
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
      return res.status(200).json(result);
    } catch (error) {
      next(error);
      return Promise.resolve();
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
      return res.status(200).json(carDetails);
    } catch (error) {
      next(error);
      return Promise.resolve();
    }
  };
}
