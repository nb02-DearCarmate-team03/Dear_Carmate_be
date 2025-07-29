import { Router } from 'express';
import { authenticateJWT } from 'src/middlewares/auth.middleware';
import validateDto from 'src/common/utils/validate.dto';
import CarController from './controller';
import { CreateCarDTO } from './dto/create-car.dto';
import { CarListQueryDto } from './dto/get-car.dto';
import { UpdateCarDto } from './dto/update-car.dto';

const CarsRouter = (carController: CarController): Router => {
  const router = Router();

  router.use(authenticateJWT);
  router.post('/', validateDto(CreateCarDTO), carController.createCar);
  router.get('/', validateDto(CarListQueryDto), carController.getCarList);
  router.patch('/:carId', validateDto(UpdateCarDto), carController.updateCar);

  return router;
};

export default CarsRouter;
