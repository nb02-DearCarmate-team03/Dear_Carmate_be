import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import UserController from './controller';
import UserService from './service';
import UserRepository from './repository';
import validateDto from '../common/utils/validate.dto';
import RegisterDto from './dto/create-user.dto';
import UpdateUserDto from './dto/update-user.dto';
import isAuthenticated from '../middlewares/passport.middlewares';
import { authorizeAdmin } from '../middlewares/auth.middleware';

const userRouter = (prisma: PrismaClient): Router => {
  const router = Router();

  const userRepository = new UserRepository(prisma);
  const userService = new UserService(userRepository);
  const userController = new UserController(userService);

  router.post('/', validateDto(RegisterDto), userController.register);
  router.get('/me', isAuthenticated, userController.getInfo);
  router.patch('/me', isAuthenticated, validateDto(UpdateUserDto), userController.updateProfile);
  router.delete('/me', isAuthenticated, userController.deleteUser);
  router.delete('/:userId', isAuthenticated, authorizeAdmin, userController.deleteUserId);

  return router;
};

export default userRouter;
