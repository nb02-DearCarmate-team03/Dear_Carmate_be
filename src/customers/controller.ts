/* eslint-disable no-unused-vars */
import { Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import { CustomerService } from './service';
import { AuthRequest } from '../middlewares/auth.middleware';
import { CreateCustomerDto, UpdateCustomerDto, CustomerListQueryDto } from './dto/customer.dto';

export class CustomerController {
  private readonly customerService: CustomerService;

  constructor(private readonly prisma: PrismaClient) {
    this.customerService = new CustomerService(prisma);
  }

  // 고객 등록
  createCustomer = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        res.status(401).json({ message: '인증이 필요합니다.' });
        return;
      }

      // 사용자의 회사 정보 조회
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
        select: { companyId: true },
      });

      if (!user) {
        res.status(401).json({ message: '사용자 정보를 찾을 수 없습니다.' });
        return;
      }

      const createCustomerDto: CreateCustomerDto = req.body;
      const customer = await this.customerService.createCustomer(user.companyId, createCustomerDto);

      res.status(201).json(customer);
    } catch (error) {
      if (error instanceof Error && error.message.includes('이미 등록된')) {
        res.status(400).json({ message: error.message });
      } else {
        next(error);
      }
    }
  };

  // 고객 목록 조회
  getCustomerList = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        res.status(401).json({ message: '인증이 필요합니다.' });
        return;
      }

      const user = await this.prisma.user.findUnique({
        where: { id: userId },
        select: { companyId: true },
      });

      if (!user) {
        res.status(401).json({ message: '사용자 정보를 찾을 수 없습니다.' });
        return;
      }

      const query = req.query as CustomerListQueryDto;
      const { page = 1, limit = 10, search } = query;

      const result = await this.customerService.getCustomerList(
        user.companyId,
        Number(page),
        Number(limit),
        search,
      );

      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  };

  // 고객 상세 정보 조회
  getCustomerById = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        res.status(401).json({ message: '인증이 필요합니다.' });
        return;
      }

      const customerIdParam = req.params.customerId;
      if (!customerIdParam) {
        res.status(400).json({ message: '고객 ID 파라미터가 없습니다.' });
        return;
      }

      const customerId = parseInt(customerIdParam, 10);
      if (Number.isNaN(customerId)) {
        res.status(400).json({ message: '유효하지 않은 고객 ID입니다.' });
        return;
      }

      const user = await this.prisma.user.findUnique({
        where: { id: userId },
        select: { companyId: true },
      });

      if (!user) {
        res.status(401).json({ message: '사용자 정보를 찾을 수 없습니다.' });
        return;
      }

      const customer = await this.customerService.getCustomerById(user.companyId, customerId);

      res.status(200).json(customer);
    } catch (error) {
      if (error instanceof Error && error.message === '존재하지 않는 고객입니다.') {
        res.status(404).json({ message: error.message });
      } else {
        next(error);
      }
    }
  };

  // 고객 수정
  updateCustomer = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        res.status(401).json({ message: '인증이 필요합니다.' });
        return;
      }

      const customerIdParam = req.params.customerId;
      if (!customerIdParam) {
        res.status(400).json({ message: '고객 ID 파라미터가 없습니다.' });
        return;
      }

      const customerId = parseInt(customerIdParam, 10);
      if (Number.isNaN(customerId)) {
        res.status(400).json({ message: '유효하지 않은 고객 ID입니다.' });
        return;
      }

      const user = await this.prisma.user.findUnique({
        where: { id: userId },
        select: { companyId: true },
      });

      if (!user) {
        res.status(401).json({ message: '사용자 정보를 찾을 수 없습니다.' });
        return;
      }

      const updateCustomerDto: UpdateCustomerDto = req.body;
      const customer = await this.customerService.updateCustomer(
        user.companyId,
        customerId,
        updateCustomerDto,
      );

      res.status(200).json(customer);
    } catch (error) {
      if (error instanceof Error) {
        if (error.message === '존재하지 않는 고객입니다.') {
          res.status(404).json({ message: error.message });
        } else if (error.message.includes('이미 등록된')) {
          res.status(400).json({ message: error.message });
        } else {
          next(error);
        }
      } else {
        next(error);
      }
    }
  };

  // 고객 삭제
  deleteCustomer = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        res.status(401).json({ message: '인증이 필요합니다.' });
        return;
      }

      const customerIdParam = req.params.customerId;
      if (!customerIdParam) {
        res.status(400).json({ message: '고객 ID 파라미터가 없습니다.' });
        return;
      }

      const customerId = parseInt(customerIdParam, 10);
      if (Number.isNaN(customerId)) {
        res.status(400).json({ message: '유효하지 않은 고객 ID입니다.' });
        return;
      }

      const user = await this.prisma.user.findUnique({
        where: { id: userId },
        select: { companyId: true },
      });

      if (!user) {
        res.status(401).json({ message: '사용자 정보를 찾을 수 없습니다.' });
        return;
      }

      const result = await this.customerService.deleteCustomer(user.companyId, customerId);

      res.status(200).json(result);
    } catch (error) {
      if (error instanceof Error && error.message === '존재하지 않는 고객입니다.') {
        res.status(404).json({ message: error.message });
      } else {
        next(error);
      }
    }
  };

  // 고객 대용량 업로드
  uploadCustomers = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        res.status(401).json({ message: '인증이 필요합니다.' });
        return;
      }

      const user = await this.prisma.user.findUnique({
        where: { id: userId },
        select: { companyId: true },
      });

      if (!user) {
        res.status(401).json({ message: '사용자 정보를 찾을 수 없습니다.' });
        return;
      }

      if (!req.file) {
        res.status(400).json({ message: '파일이 없습니다.' });
        return;
      }

      const result = await this.customerService.uploadCustomers(user.companyId, userId, req.file);

      res.status(200).json(result);
    } catch (error) {
      if (
        error instanceof Error &&
        (error.message.includes('CSV 파일만') || error.message.includes('업로드'))
      ) {
        res.status(400).json({ message: error.message });
      } else {
        next(error);
      }
    }
  };
}
