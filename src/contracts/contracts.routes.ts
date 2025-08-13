// src/contracts/contracts.routes.ts
import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { ContractService } from './service';
import ContractController from './controller';
import { isAuthenticated } from '../middlewares/passport.middlewares';
import validateDto from '../common/utils/validate.dto';
import { CreateContractDto } from './dto/create-contract.dto';
import { UpdateContractDto } from './dto/update-contract.dto';

export default function buildContractRouter(prismaClient: PrismaClient) {
  const service = new ContractService(prismaClient);
  const controller = new ContractController(service);

  const router = Router();

  // 모든 계약 API는 인증 필요
  router.use(isAuthenticated);

  /**
   * @swagger
   * /contracts/cars:
   *   get:
   *     tags: [Contracts]
   *     summary: 계약용 차량 선택 목록 조회
   *     description: 계약 등록/수정 시 사용할 차량 목록 조회
   *     responses:
   *       '200':
   *         description: 차량 목록 조회 성공
   *         content:
   *           application/json:
   *             schema:
   *               type: array
   *               items:
   *                 $ref: '#/components/schemas/ContractCarOption'
   *       '401': { $ref: '#/components/responses/Unauthorized' }
   */
  router.get('/cars', controller.getContractCars);

  /**
   * @swagger
   * /contracts/customers:
   *   get:
   *     tags: [Contracts]
   *     summary: 계약용 고객 선택 목록 조회
   *     responses:
   *       '200':
   *         description: 고객 목록 조회 성공
   *         content:
   *           application/json:
   *             schema:
   *               type: array
   *               items:
   *                 $ref: '#/components/schemas/ContractCustomerOption'
   *       '401': { $ref: '#/components/responses/Unauthorized' }
   */
  router.get('/customers', controller.getContractCustomers);

  /**
   * @swagger
   * /contracts/users:
   *   get:
   *     tags: [Contracts]
   *     summary: 계약용 담당자 선택 목록 조회
   *     responses:
   *       '200':
   *         description: 담당자 목록 조회 성공
   *         content:
   *           application/json:
   *             schema:
   *               type: array
   *               items:
   *                 $ref: '#/components/schemas/ContractUserOption'
   *       '401': { $ref: '#/components/responses/Unauthorized' }
   */
  router.get('/users', controller.getContractUsers);

  /**
   * @swagger
   * /contracts:
   *   post:
   *     tags: [Contracts]
   *     summary: 계약 등록
   *     description: 새로운 계약 정보 등록
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             $ref: '#/components/schemas/CreateContractRequest'
   *     responses:
   *       '201':
   *         description: 계약 등록 성공
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ContractResponse'
   *       '400': { $ref: '#/components/responses/BadRequest' }
   *       '401': { $ref: '#/components/responses/Unauthorized' }
   */
  router.post('/', validateDto(CreateContractDto), controller.createContract);

  /**
   * @swagger
   * /contracts:
   *   get:
   *     tags: [Contracts]
   *     summary: 계약 목록 조회
   *     description: 등록된 계약 목록 조회 (검색, 페이지네이션, 그룹화 지원)
   *     parameters:
   *       - $ref: '#/components/parameters/PageParam'
   *       - $ref: '#/components/parameters/PageSizeParam'
   *       - in: query
   *         name: searchBy
   *         schema: { type: string, enum: [customerName, userName] }
   *       - $ref: '#/components/parameters/KeywordParam'
   *       - in: query
   *         name: grouped
   *         schema: { type: string, enum: [true, false] }
   *     responses:
   *       '200': { description: 계약 목록 조회 성공 }
   *       '401': { $ref: '#/components/responses/Unauthorized' }
   */
  router.get('/', controller.getContracts);

  /**
   * @swagger
   * /contracts/{contractId}:
   *   get:
   *     tags: [Contracts]
   *     summary: 계약 단건 조회
   *     parameters:
   *       - in: path
   *         name: contractId
   *         required: true
   *         schema: { type: integer }
   *     responses:
   *       '200': { description: 조회 성공 }
   *       '404': { $ref: '#/components/responses/NotFound' }
   */
  router.get('/:contractId', controller.getContract);

  /**
   * @swagger
   * /contracts/{contractId}:
   *   patch:
   *     tags: [Contracts]
   *     summary: 계약 정보 수정
   *     parameters:
   *       - in: path
   *         name: contractId
   *         required: true
   *         schema: { type: integer }
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             $ref: '#/components/schemas/UpdateContractRequest'
   *     responses:
   *       '200': { description: 계약 정보 수정 성공 }
   *       '400': { $ref: '#/components/responses/BadRequest' }
   *       '401': { $ref: '#/components/responses/Unauthorized' }
   *       '404': { $ref: '#/components/responses/NotFound' }
   */
  router.patch('/:contractId', validateDto(UpdateContractDto), controller.updateContract);

  /**
   * @swagger
   * /contracts/{contractId}:
   *   delete:
   *     tags: [Contracts]
   *     summary: 계약 삭제
   *     parameters:
   *       - in: path
   *         name: contractId
   *         required: true
   *         schema: { type: integer }
   *     responses:
   *       '204': { description: 계약 삭제 성공 }
   *       '401': { $ref: '#/components/responses/Unauthorized' }
   *       '404': { $ref: '#/components/responses/NotFound' }
   */
  router.delete('/:contractId', controller.deleteContract);

  return router;
}
