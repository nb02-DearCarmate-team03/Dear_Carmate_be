// src/contracts/contracts.routes.ts
import { Router } from 'express';
import { PrismaClient } from '@prisma/client';

import isAuthenticated from '../middlewares/passport.middlewares';
import validateDto from '../common/utils/validate.dto';

import ContractRepository from './repository';
import { ContractService } from './service';
import ContractController from './controller';

import { CreateContractDto } from './dto/create-contract.dto';
import { UpdateContractDto } from './dto/update-contract.dto';

const ContractsRouter = (prisma: PrismaClient): Router => {
  const contractRouter = Router();

  // 의존성 구성: Repository → Service → Controller
  const repo = new ContractRepository(prisma);
  const service = new ContractService(repo);
  const controller = new ContractController(service);

  // 모든 계약 API는 인증 필요
  contractRouter.use(isAuthenticated);

  // POST /contracts - 계약 등록
  contractRouter.post('/', validateDto(CreateContractDto), controller.createContract);

  // GET /contracts - 계약 목록 조회 (검색: 고객명/담당자명)
  contractRouter.get('/', controller.getContracts);

  // PATCH /contracts/:contractId - 계약 수정
  contractRouter.patch('/:contractId', validateDto(UpdateContractDto), controller.updateContract);

  // DELETE /contracts/:contractId - 계약 삭제
  contractRouter.delete('/:contractId', controller.deleteContract);

  // 계약 작성용 드롭다운 데이터
  contractRouter.get('/cars', controller.getContractCars);
  contractRouter.get('/customers', controller.getContractCustomers);
  contractRouter.get('/users', controller.getContractUsers);

  return contractRouter;
};

export default ContractsRouter;
