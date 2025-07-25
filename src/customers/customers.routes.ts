import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import multer from 'multer';
import { CustomerController } from './controller';
import { authenticateJWT } from '../middlewares/auth.middleware';
import validateDto from '../common/utils/validate.dto';
import { CreateCustomerDto, UpdateCustomerDto } from './dto/customer.dto';

const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB
  },
});

const createCustomerRoutes = (prisma: PrismaClient): Router => {
  const router = Router();
  const customerController = new CustomerController(prisma);

  // 모든 라우트에 인증 미들웨어 적용
  router.use(authenticateJWT);

  // 고객 등록
  router.post('/', validateDto(CreateCustomerDto), customerController.createCustomer);

  // 고객 목록 조회
  router.get('/', customerController.getCustomerList);

  // 고객 상세 정보 조회
  router.get('/:customerId', customerController.getCustomerById);

  // 고객 수정
  router.patch('/:customerId', validateDto(UpdateCustomerDto), customerController.updateCustomer);

  // 고객 삭제
  router.delete('/:customerId', customerController.deleteCustomer);

  // 고객 대용량 업로드
  router.post('/upload', upload.single('file'), customerController.uploadCustomers);

  return router;
};

export default createCustomerRoutes;
