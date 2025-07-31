import { Request, Response, NextFunction } from 'express';
import UserService from './service';
import RegisterDto from './dto/create-user.dto';
import UpdateUserDto from './dto/update-user.dto';

class UserController {
  private readonly userService: UserService;

  constructor(userService: UserService) {
    this.userService = userService;
  }

  register = async (req: Request, res: Response, next: NextFunction): Promise<Response | void> => {
    try {
      const userData: RegisterDto = req.body;
      const newUser = await this.userService.register(userData);
      return res.status(201).json(newUser);
    } catch (error: unknown) {
      return next(error);
    }
  };

  getInfo = async (req: Request, res: Response, next: NextFunction): Promise<Response | void> => {
    try {
      const user = req.user as { id: number };
      const data = await this.userService.getInfo(user.id);
      return res.json(data);
    } catch (error: unknown) {
      return next(error);
    }
  };

  updateProfile = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<Response | void> => {
    try {
      const user = req.user as { id: number };
      const updateData: UpdateUserDto = req.body;
      const updatedUser = await this.userService.updateProfile(user.id, updateData);
      return res.json(updatedUser);
    } catch (error: unknown) {
      return next(error);
    }
  };

  deleteUser = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<Response | void> => {
    try {
      const user = req.user as { id: number };
      await this.userService.deleteUser(user.id);
      return res.status(200).json({ message: '유저 삭제 성공.' });
    } catch (error: unknown) {
      return next(error);
    }
  };

  deleteUserId = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<Response | void> => {
    try {
      const userId = Number(req.params.userId);
      await this.userService.deleteUser(userId);
      return res.status(200).json({ message: '유저 삭제 성공.' });
    } catch (error: unknown) {
      return next(error);
    }
  };
}

export default UserController;
