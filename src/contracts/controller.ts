import { Request, Response, NextFunction } from 'express';
import { ContractService, RequestUser } from './service';

import { CreateContractDto } from './dto/create-contract.dto';
import { UpdateContractDto } from './dto/update-contract.dto';

import { UnauthorizedError } from '../common/errors/unauthorized-error';
import { BadRequestError } from '../common/errors/bad-request-error';

export default class ContractController {
  private readonly contractService: ContractService;

  constructor(contractService: ContractService) {
    this.contractService = contractService;
  }

  // POST /contracts - 계약 등록
  createContract = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { user } = req;
      if (!user) throw new UnauthorizedError('로그인이 필요합니다.');

      const authUser = user as RequestUser;
      const dto = req.body as CreateContractDto;

      const created = await this.contractService.createContract(authUser, dto);
      res.status(201).json(created);
    } catch (err) {
      next(err);
    }
  };

  // GET /contracts - 계약 목록 조회
  getContracts = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { user } = req;
      if (!user) throw new UnauthorizedError('로그인이 필요합니다.');

      const authUser = user as RequestUser;
      const { searchBy, keyword } = req.query as {
        searchBy?: 'customerName' | 'userName';
        keyword?: string;
      };

      const list = await this.contractService.getContracts(authUser, { searchBy, keyword });
      res.status(200).json(list);
    } catch (err) {
      next(err);
    }
  };

  // PATCH /contracts/:contractId - 계약 수정
  updateContract = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { user } = req;
      if (!user) throw new UnauthorizedError('로그인이 필요합니다.');

      const authUser = user as RequestUser;
      const contractId = Number(req.params.contractId);
      if (Number.isNaN(contractId)) throw new BadRequestError('잘못된 요청입니다.');

      const dto = req.body as UpdateContractDto;
      const updated = await this.contractService.updateContract(authUser, contractId, dto);
      res.status(200).json(updated);
    } catch (err) {
      next(err);
    }
  };

  // DELETE /contracts/:contractId - 계약 삭제
  deleteContract = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { user } = req;
      if (!user) throw new UnauthorizedError('로그인이 필요합니다.');

      const authUser = user as RequestUser;
      const contractId = Number(req.params.contractId);
      if (Number.isNaN(contractId)) throw new BadRequestError('잘못된 요청입니다.');

      await this.contractService.deleteContract(authUser, contractId);
      res.status(200).json({ message: '계약 삭제 성공' });
    } catch (err) {
      next(err);
    }
  };

  // 선택 리스트: 차량
  getContractCars = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { user } = req;
      if (!user) throw new UnauthorizedError('로그인이 필요합니다.');
      const authUser = user as RequestUser;

      const data = await this.contractService.getContractCars(authUser);
      res.status(200).json(data);
    } catch (err) {
      next(err);
    }
  };

  // 선택 리스트: 고객
  getContractCustomers = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { user } = req;
      if (!user) throw new UnauthorizedError('로그인이 필요합니다.');
      const authUser = user as RequestUser;

      const data = await this.contractService.getContractCustomers(authUser);
      res.status(200).json(data);
    } catch (err) {
      next(err);
    }
  };

  // 선택 리스트: 담당자
  getContractUsers = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { user } = req;
      if (!user) throw new UnauthorizedError('로그인이 필요합니다.');
      const authUser = user as RequestUser;

      const data = await this.contractService.getContractUsers(authUser);
      res.status(200).json(data);
    } catch (err) {
      next(err);
    }
  };
}
