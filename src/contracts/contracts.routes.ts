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
  /**
   * @swagger
   * /contracts:
   *   post:
   *     tags:
   *       - Contracts
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
   *       '400':
   *         $ref: '#/components/responses/BadRequest'
   *       '401':
   *         $ref: '#/components/responses/Unauthorized'
   */

  /** POST /contracts - 계약 등록 */
  contractRouter.post('/', validateDto(CreateContractDto), controller.createContract);
  /**
   * @swagger
   * /contracts:
   *   get:
   *     tags:
   *       - Contracts
   *     summary: 계약 목록 조회
   *     description: 등록된 계약 목록 조회 (검색, 페이지네이션, 그룹화 지원)
   *     parameters:
   *       - $ref: '#/components/parameters/PageParam'
   *       - $ref: '#/components/parameters/PageSizeParam'
   *       - in: query
   *         name: searchBy
   *         schema:
   *           type: string
   *           enum: [customerName, userName]
   *         description: 검색 기준
   *       - $ref: '#/components/parameters/KeywordParam'
   *       - in: query
   *         name: grouped
   *         schema:
   *           type: string
   *           enum: [true, false]
   *         description: 상태별 그룹화 여부
   *     responses:
   *       '200':
   *         description: 계약 목록 조회 성공
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 totalCount:
   *                   type: integer
   *                   description: 전체 검색 결과 수
   *                 data:
   *                   type: array
   *                   items:
   *                     type: object
   *                     properties:
   *                       id:
   *                         type: string
   *                         description: 계약 ID
   *                       car:
   *                         type: object
   *                         properties:
   *                           id:
   *                             type: integer
   *                           name:
   *                             type: string
   *                           model:
   *                             type: string
   *                         example:
   *                           id: 1
   *                           name: "아반떼"
   *                           model: "KS"
   *                       customer:
   *                         type: object
   *                         properties:
   *                           id:
   *                             type: integer
   *                           name:
   *                             type: string
   *                         example:
   *                           id: 1
   *                           name: "김철수"
   *                       user:
   *                         type: object
   *                         properties:
   *                           id:
   *                             type: integer
   *                           name:
   *                             type: string
   *                         example:
   *                           id: 1
   *                           name: "김민재"
   *                       contract:
   *                         type: object
   *                         properties:
   *                           date:
   *                             type: object
   *                             properties:
   *                               from:
   *                                 type: string
   *                                 format: date-time
   *                                 description: 계약 시작일
   *                               to:
   *                                 type: string
   *                                 format: date-time
   *                                 description: 계약 종료일
   *                           contractPrice:
   *                             type: integer
   *                             description: 계약 가격
   *                           status:
   *                             type: string
   *                             description: 계약 상태
   *                         example:
   *                           date:
   *                             from: "2024-02-21T09:00:00.000Z"
   *                             to: "2024-02-21T09:00:00.000Z"
   *                           contractPrice: 2000000
   *                           status: "string"
   *                       priceNegotiation:
   *                         type: array
   *                         items:
   *                           type: object
   *                           properties:
   *                             price:
   *                               type: integer
   *                             date:
   *                               type: string
   *                               format: date-time
   *                         example:
   *                           - price: 1800000
   *                             date: "2024-02-21T07:49:09.000Z"
   *       '401':
   *         $ref: '#/components/responses/Unauthorized'
   */
  contractRouter.get('/', controller.getContracts);
  /**
   * @swagger
   * /contracts/{contractId}:
   *   patch:
   *     tags:
   *       - Contracts
   *     summary: 계약 정보 수정
   *     description: 계약 정보 수정
   *     parameters:
   *       - in: path
   *         name: contractId
   *         required: true
   *         schema:
   *           type: integer
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             $ref: '#/components/schemas/UpdateContractRequest'
   *     responses:
   *       '200':
   *         description: 계약 정보 수정 성공
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ContractResponse'
   *             example:
   *               id: 123
   *               status: "contract_complete"
   *               resolutionDate:
   *                 from: "2024-02-22T09:00:00.000Z"
   *                 to: "2024-02-23T09:00:00.000Z"
   *               attachments:
   *                 - id: 1
   *                   fileName: "contract file 1"
   *                 - id: 2
   *                   fileName: "contract file 2"
   *               car:
   *                 id: 1
   *                 name: "아반떼"
   *                 model: "KS"
   *               customer:
   *                 id: 2
   *                 name: "김철수"
   *               user:
   *                 id: 3
   *                 name: "김민재"
   *       '400':
   *         $ref: '#/components/responses/BadRequest'
   *       '401':
   *         $ref: '#/components/responses/Unauthorized'
   *       '404':
   *         $ref: '#/components/responses/NotFound'
   */
  contractRouter.patch('/:contractId', validateDto(UpdateContractDto), controller.updateContract);
  /**
   * @swagger
   * /contracts/{contractId}:
   *   delete:
   *     tags:
   *       - Contracts
   *     summary: 계약 삭제
   *     description: 계약 정보 삭제
   *     parameters:
   *       - in: path
   *         name: contractId
   *         required: true
   *         schema:
   *           type: integer
   *     responses:
   *       '204':
   *         description: 계약 삭제 성공
   *       '401':
   *         $ref: '#/components/responses/Unauthorized'
   *       '404':
   *         $ref: '#/components/responses/NotFound'
   */
  /** DELETE /contracts/:contractId - 계약 삭제 */
  contractRouter.delete('/:contractId', controller.deleteContract);
  /**
   * @swagger
   * /contracts/cars:
   *   get:
   *     tags:
   *       - Contracts
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
   *             example:
   *               - id: 1
   *                 data: "그랜저 (111가 1111)"
   *               - id: 2
   *                 data: "소나타 (222나 2222)"
   *               - id: 3
   *                 data: "아반떼 (333다 3333)"
   *       '401':
   *         $ref: '#/components/responses/Unauthorized'
   */
  contractRouter.get('/cars', controller.getContractCars);
  /**
   * @swagger
   * /contracts/customers:
   *   get:
   *     tags:
   *       - Contracts
   *     summary: 계약용 고객 선택 목록 조회
   *     description: 계약 등록/수정 시 사용할 고객 목록 조회
   *     responses:
   *       '200':
   *         description: 고객 목록 조회 성공
   *         content:
   *           application/json:
   *             schema:
   *               type: array
   *               items:
   *                 $ref: '#/components/schemas/ContractCustomerOption'
   *             example:
   *               - id: 1
   *                 data: "김철수(chulsu@codeit.com)"
   *               - id: 2
   *                 data: "박영희(younghee@codeit.com)"
   *               - id: 3
   *                 data: "이민지(minji@codeit.com)"
   *       '401':
   *         $ref: '#/components/responses/Unauthorized'
   */
  contractRouter.get('/customers', controller.getContractCustomers);
  /**
   * @swagger
   * /contracts/users:
   *   get:
   *     tags:
   *       - Contracts
   *     summary: 계약용 담당자 선택 목록 조회
   *     description: 계약 등록/수정 시 사용할 담당자 목록 조회
   *     responses:
   *       '200':
   *         description: 담당자 목록 조회 성공
   *         content:
   *           application/json:
   *             schema:
   *               type: array
   *               items:
   *                 $ref: '#/components/schemas/ContractUserOption'
   *             example:
   *               - id: 1
   *                 data: "최효정(hjhj@codeit.com)"
   *               - id: 2
   *                 data: "김이박(kip@codeit.com)"
   *               - id: 3
   *                 data: "최홍만(hm@codeit.com)"
   *       '401':
   *         $ref: '#/components/responses/Unauthorized'
   */
  contractRouter.get('/users', controller.getContractUsers);

  return contractRouter;
};

export default ContractsRouter;
