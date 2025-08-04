import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import AuthController from './controller';
import validateDto from '../common/utils/validate.dto';
import { LoginDto } from './dto/login.dto';
import AuthService from './service';
import AuthRepository from './repository';
import isAuthenticated from './auth';

const authRouter = (prisma: PrismaClient): Router => {
  const router = Router();

  const authRepository = new AuthRepository(prisma);
  const authService = new AuthService(authRepository);
  const authController = new AuthController(authService);

  router.post('/login', validateDto(LoginDto), authController.login);
  router.post('/refresh', authController.refresh);
  router.post('/logout', isAuthenticated, authController.logout);

  return router;
};

export default authRouter;
