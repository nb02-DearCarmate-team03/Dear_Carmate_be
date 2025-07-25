import express from 'express';
import UserController from './controller';
import validateDto from '../common/utils/validate.dto';
import RegisterDto from './dto/create-user.dto';

const router = express.Router();

router.post('/users', validateDto(RegisterDto), UserController.register);

export default router;
