import { Router } from 'express';
import validateDto from 'src/common/utils/validate.dto';
import { PrismaClient } from '@prisma/client';
import isAuthenticated from 'src/auth/auth';
import CarService from './service';
import CarController, { upload } from './controller';
import { CreateCarDTO } from './dto/create-car.dto';
import { CarListQueryDto } from './dto/get-car.dto';
import { UpdateCarDto } from './dto/update-car.dto';
import CarRepository from './repository';

const CarsRouter = (prisma: PrismaClient): Router => {
  const router = Router();

  const carRepository = new CarRepository(prisma);
  const carService = new CarService(carRepository);
  const carController = new CarController(carService);

  router.use(isAuthenticated);
  router.post('/', validateDto(CreateCarDTO), carController.createCar);
  router.get('/', validateDto(CarListQueryDto), carController.getCarList);
  router.patch('/:carId', validateDto(UpdateCarDto), carController.updateCar);
  router.delete('/:carId', carController.deleteCar);
  router.get('/:carId', carController.getCarDetails);
  router.post('/upload', upload.single('file'), carController.uploadCars);
  router.get('/models', carController.getCarModelList);

  return router;
};

export default CarsRouter;
