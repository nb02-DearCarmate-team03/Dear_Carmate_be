import { Router } from 'express';
import AuthController from './controller';
import validateDto from '../common/utils/validate.dto';
import { LoginDto } from './dto/login.dto';

const AuthRoutes = (authController: AuthController): Router => {
  const router = Router();

  router.post('/login', validateDto(LoginDto), authController.login);
  router.post('/refresh', authController.refresh);

  return router;
};

export default AuthRoutes;
