import { Request, Response, NextFunction } from 'express';
import UserService from './service';
import RegisterDto from './dto/create-user.dto';

class UserController {
  static async register(req: Request, res: Response, next: NextFunction) {
    try {
      const userData: RegisterDto = req.body;
      const newUser = await UserService.register(userData);

      res.status(201).json(newUser);
    } catch (error) {
      next(error);
    }
  }
}

export default UserController;
