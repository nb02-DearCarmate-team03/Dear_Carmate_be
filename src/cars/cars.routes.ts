import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import isAuthenticated from '../middlewares/passport.middlewares';
import validateDto from '../common/utils/validate.dto';
import CarService from './service';
import CarController, { upload } from './controller';
import { CreateCarDTO } from './dto/create-car.dto';
import { CarListQueryDto } from './dto/get-car.dto';
import { UpdateCarDto } from './dto/update-car.dto';
import CarRepository from './repository';

/**
 * @swagger
 * components:
 *   schemas:
 *     CarType:
 *       type: string
 *       enum:
 *         - 경·소형
 *         - 준중·중형
 *         - 대형
 *         - 스포츠카
 *         - SUV
 *     CarStatus:
 *       type: string
 *       enum:
 *         - possession
 *         - contractProceeding
 *         - contractCompleted
 */

const CarsRouter = (prisma: PrismaClient): Router => {
  const router = Router();

  const carRepository = new CarRepository(prisma);
  const carService = new CarService(carRepository);
  const carController = new CarController(carService);

  router.use(isAuthenticated);

  /**
   * @swagger
   * /api/cars:
   *   post:
   *     tags:
   *       - Cars
   *     summary: 차량 등록
   *     description: 새로운 차량 정보 등록
   *     security:
   *       - bearerAuth: []
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required:
   *               - carNumber
   *               - manufacturer
   *               - model
   *               - type
   *               - manufacturingYear
   *               - mileage
   *               - price
   *             properties:
   *               carNumber:
   *                 type: string
   *                 example: "12가3456"
   *               manufacturer:
   *                 type: string
   *                 example: "현대"
   *               model:
   *                 type: string
   *                 example: "쏘나타"
   *               type:
   *                 $ref: '#/components/schemas/CarType'
   *               manufacturingYear:
   *                 type: integer
   *                 example: 2023
   *               mileage:
   *                 type: integer
   *                 example: 10000
   *               price:
   *                 type: number
   *                 example: 25000000
   *               accidentCount:
   *                 type: integer
   *                 default: 0
   *                 example: 0
   *               explanation:
   *                 type: string
   *                 example: "무사고 차량입니다"
   *               accidentDetails:
   *                 type: string
   *                 example: "없음"
   *     responses:
   *       201:
   *         description: 차량 등록 성공
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 id:
   *                   type: integer
   *                 carNumber:
   *                   type: string
   *                 manufacturer:
   *                   type: string
   *                 model:
   *                   type: string
   *                 type:
   *                   $ref: '#/components/schemas/CarType'
   *                 manufacturingYear:
   *                   type: integer
   *                 mileage:
   *                   type: integer
   *                 price:
   *                   type: number
   *                 accidentCount:
   *                   type: integer
   *                 explanation:
   *                   type: string
   *                 accidentDetails:
   *                   type: string
   *                 status:
   *                   $ref: '#/components/schemas/CarStatus'
   *       400:
   *         description: 잘못된 요청
   *       401:
   *         description: 인증이 필요합니다
   *       409:
   *         description: 이미 존재하는 차량 번호
   */

  router.post('/', validateDto(CreateCarDTO), carController.createCar);

  /**
   * @swagger
   * /api/cars:
   *   get:
   *     tags:
   *       - Cars
   *     summary: 차량 목록 조회
   *     description: 등록된 차량 목록 조회
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: query
   *         name: page
   *         schema:
   *           type: integer
   *           default: 1
   *         description: 페이지 번호
   *       - in: query
   *         name: pageSize
   *         schema:
   *           type: integer
   *           default: 8
   *         description: 페이지당 아이템 수
   *       - in: query
   *         name: status
   *         schema:
   *           type: string
   *           enum: [possession, contractProceeding, contractCompleted]
   *         description: 차량 상태
   *       - in: query
   *         name: searchBy
   *         schema:
   *           type: string
   *           enum: [carNumber, model]
   *         description: 검색 기준
   *       - in: query
   *         name: keyword
   *         schema:
   *           type: string
   *         description: 검색 키워드
   *     responses:
   *       200:
   *         description: 차량 목록 조회 성공
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 currentPage:
   *                   type: integer
   *                 totalPages:
   *                   type: integer
   *                 totalItemCount:
   *                   type: integer
   *                 data:
   *                   type: array
   *                   items:
   *                     type: object
   *                     properties:
   *                       id:
   *                         type: integer
   *                       carNumber:
   *                         type: string
   *                       manufacturer:
   *                         type: string
   *                       model:
   *                         type: string
   *                       type:
   *                         $ref: '#/components/schemas/CarType'
   *                       manufacturingYear:
   *                         type: integer
   *                       mileage:
   *                         type: integer
   *                       price:
   *                         type: number
   *                       accidentCount:
   *                         type: integer
   *                       explanation:
   *                         type: string
   *                       accidentDetails:
   *                         type: string
   *                       status:
   *                         $ref: '#/components/schemas/CarStatus'
   *       401:
   *         description: 인증이 필요합니다
   */

  router.get('/', validateDto(CarListQueryDto), carController.getCarList);

  /**
   * @swagger
   * /api/cars/models:
   *   get:
   *     tags:
   *       - Cars
   *     summary: 차량 모델 목록 조회
   *     description: 제조사별 차량 모델 목록 조회
   *     security:
   *       - bearerAuth: []
   *     responses:
   *       200:
   *         description: 차량 모델 목록 조회 성공
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 data:
   *                   type: array
   *                   items:
   *                     type: object
   *                     properties:
   *                       manufacturer:
   *                         type: string
   *                         example: "현대"
   *                       model:
   *                         type: array
   *                         items:
   *                           type: string
   *                         example: ["쏘나타", "그랜저", "아반떼"]
   *       401:
   *         description: 인증이 필요합니다
   */

  router.get('/models', carController.getCarModelList);

  /**
   * @swagger
   * /api/cars/{carId}:
   *   patch:
   *     tags:
   *       - Cars
   *     summary: 차량 정보 수정
   *     description: 차량 정보 수정
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: carId
   *         required: true
   *         schema:
   *           type: integer
   *         description: 수정할 차량 ID
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             properties:
   *               carNumber:
   *                 type: string
   *               manufacturer:
   *                 type: string
   *               model:
   *                 type: string
   *               manufacturingYear:
   *                 type: integer
   *               mileage:
   *                 type: integer
   *               price:
   *                 type: number
   *               accidentCount:
   *                 type: integer
   *               explanation:
   *                 type: string
   *               accidentDetails:
   *                 type: string
   *     responses:
   *       200:
   *         description: 차량 정보 수정 성공
   *       400:
   *         description: 잘못된 요청
   *       401:
   *         description: 인증이 필요합니다
   *       403:
   *         description: 권한이 없습니다
   *       404:
   *         description: 차량을 찾을 수 없습니다
   */

  router.patch('/:carId', validateDto(UpdateCarDto), carController.updateCar);

  /**
   * @swagger
   * /api/cars/{carId}:
   *   delete:
   *     tags:
   *       - Cars
   *     summary: 차량 삭제
   *     description: 차량 정보 삭제
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: carId
   *         required: true
   *         schema:
   *           type: integer
   *         description: 삭제할 차량 ID
   *     responses:
   *       200:
   *         description: 차량 삭제 성공
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 message:
   *                   type: string
   *                   example: "차량 삭제 성공"
   *       401:
   *         description: 인증이 필요합니다
   *       403:
   *         description: 권한이 없습니다
   *       404:
   *         description: 차량을 찾을 수 없습니다
   */

  router.delete('/:carId', carController.deleteCar);

  /**
   * @swagger
   * /api/cars/{carId}:
   *   get:
   *     tags:
   *       - Cars
   *     summary: 차량 상세 조회
   *     description: 특정 차량의 상세 정보 조회
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: carId
   *         required: true
   *         schema:
   *           type: integer
   *         description: 조회할 차량 ID
   *     responses:
   *       200:
   *         description: 차량 상세 조회 성공
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 id:
   *                   type: integer
   *                 carNumber:
   *                   type: string
   *                 manufacturer:
   *                   type: string
   *                 model:
   *                   type: string
   *                 type:
   *                   $ref: '#/components/schemas/CarType'
   *                 manufacturingYear:
   *                   type: integer
   *                 mileage:
   *                   type: integer
   *                 price:
   *                   type: number
   *                 accidentCount:
   *                   type: integer
   *                 explanation:
   *                   type: string
   *                 accidentDetails:
   *                   type: string
   *                 status:
   *                   $ref: '#/components/schemas/CarStatus'
   *       401:
   *         description: 인증이 필요합니다
   *       404:
   *         description: 차량을 찾을 수 없습니다
   */

  router.get('/:carId', carController.getCarDetails);

  /**
   * @swagger
   * /api/cars/upload:
   *   post:
   *     tags:
   *       - Cars
   *     summary: 차량 대용량 업로드
   *     description: CSV 파일을 통한 차량 정보 대용량 등록
   *     security:
   *       - bearerAuth: []
   *     requestBody:
   *       required: true
   *       content:
   *         multipart/form-data:
   *           schema:
   *             type: object
   *             required:
   *               - file
   *             properties:
   *               file:
   *                 type: string
   *                 format: binary
   *                 description: CSV 파일 (최대 10MB)
   *     responses:
   *       200:
   *         description: 차량 업로드 성공
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 message:
   *                   type: string
   *                   example: "CSV 파일 처리가 완료되었습니다."
   *       400:
   *         description: 잘못된 요청
   *       401:
   *         description: 인증이 필요합니다
   */

  router.post('/upload', upload.single('file'), carController.uploadCars);

  return router;
};

export default CarsRouter;
