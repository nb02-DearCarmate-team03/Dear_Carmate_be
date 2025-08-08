import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import isAuthenticated from '../auth/auth';
import validateDto from '../common/utils/validate.dto';
import CarService from './service';
import CarController from './controller';
import { CreateCarDTO } from './dto/create-car.dto';
import { CarListQueryDto } from './dto/get-car.dto';
import { UpdateCarDto } from './dto/update-car.dto';
import CarRepository from './repository';
import csvUpload from '../middlewares/csv-upload.middleware';

const CarsRouter = (prisma: PrismaClient): Router => {
  const router = Router();

  const carRepository = new CarRepository(prisma);
  const carService = new CarService(carRepository);
  const carController = new CarController(carService);

  router.use(isAuthenticated);
  router.post('/', validateDto(CreateCarDTO), carController.createCar);
  router.get('/', validateDto(CarListQueryDto), carController.getCarList);
  router.get('/models', carController.getCarModelList);
  router.patch('/:carId', validateDto(UpdateCarDto), carController.updateCar);
  router.delete('/:carId', carController.deleteCar);
  router.get('/:carId', carController.getCarDetails);
  router.post('/upload', csvUpload.single('file'), carController.uploadCars);

  return router;
};

export default CarsRouter;
