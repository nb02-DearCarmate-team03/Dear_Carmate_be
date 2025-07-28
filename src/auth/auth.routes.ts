import express from 'express';
import AuthController from './controller';
import validateDto from '../common/utils/validate.dto';
import { LoginDto } from './dto/login.dto';

const router = express.Router();

router.post('/login', validateDto(LoginDto), AuthController.login);
router.post('/refresh', AuthController.refresh);

export default router;
