import { Request, Response, NextFunction } from 'express';
import { ContractService } from './service';
import { CreateContractDto } from './dto/create-contract.dto';
import { UpdateContractDto } from './dto/update-contract.dto';
import { mapContract } from './contract.mapper';
import { ContractSearchBy } from './repository';

// 요청 사용자 타입
interface RequestUser {
  id: number;
  companyId: number;
  name: string;
  email: string;
  isAdmin: boolean;
}

export default class ContractController {
  private readonly contractService: ContractService;
  constructor(contractService: ContractService) {
    this.contractService = contractService;
  }

  // 계약 목록 조회
  getContracts = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const user = req.user as RequestUser;
      const { searchBy, keyword, page, pageSize, grouped } = req.query as {
        searchBy?: ContractSearchBy;
        keyword?: string;
        page?: string;
        pageSize?: string;
        grouped?: string;
      };

      const toNum = (v?: string) => {
        if (v == null) return undefined;
        const n = Number(v);
        return Number.isFinite(n) && n > 0 ? n : undefined;
      };

      const pageNum = toNum(page);
      const sizeNum = toNum(pageSize);

      const wantsGrouped = grouped === undefined || grouped === 'true';

      if (wantsGrouped) {
        const result = await this.contractService.getContractsGroupedPage(user, {
          searchBy,
          keyword,
          page: pageNum,
          pageSize: sizeNum,
        });
        res.status(200).json(result.data);
        return;
      }

      const result = await this.contractService.getContractsPage(user, {
        searchBy,
        keyword,
        page: pageNum!,
        pageSize: sizeNum!,
      });
      res.status(200).json(result);
    } catch (error) {
      next(error as Error);
    }
  };

  // 계약 단건 조회
  getContract = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const contractId = Number(req.params.contractId);
      const row = await this.contractService.getContractById(contractId);

      if (!row) {
        res.status(404).json({ message: '존재하지 않는 계약입니다.' });
        return;
      }

      res.status(200).json(mapContract(row));
    } catch (error) {
      next(error);
    }
  };

  // 계약 등록
  createContract = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const user = req.user as RequestUser;
      const body = req.body as CreateContractDto & {
        userId: number;
        customerId: number;
        carId: number;
      };

      const created = await this.contractService.createContract(user, body);
      res.status(201).json(mapContract(created));
    } catch (error) {
      next(error);
    }
  };

  // 계약 수정
  updateContract = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const user = req.user as RequestUser;
      const contractId = Number(req.params.contractId);
      const dto = req.body as UpdateContractDto;

      const updated = await this.contractService.updateContract(user, contractId, dto);
      res.status(200).json(mapContract(updated));
    } catch (error) {
      next(error);
    }
  };

  // 계약 삭제
  deleteContract = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const user = req.user as RequestUser;
      const contractId = Number(req.params.contractId);
      await this.contractService.deleteContract(user, contractId);
      res.status(200).json({ message: 'OK' });
    } catch (e) {
      next(e as Error);
    }
  };

  // 계약용 차량 선택 목록
  getContractCars = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const user = req.user as RequestUser;
      const rows = await this.contractService.getContractCars(user);
      res.status(200).json(rows.map((r) => ({ id: r.id, data: r.model })));
    } catch (e) {
      next(e as Error);
    }
  };

  // 계약용 고객 선택 목록
  getContractCustomers = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const user = req.user as RequestUser;
      const rows = await this.contractService.getContractCustomers(user); // { id, name }
      res.status(200).json(rows.map((r) => ({ id: r.id, data: r.name })));
    } catch (e) {
      next(e as Error);
    }
  };

  // 계약용 사용자 선택 목록
  getContractUsers = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const user = req.user as RequestUser;
      const rows = await this.contractService.getContractUsers(user); // { id, name, email }
      res.status(200).json(rows.map((r) => ({ id: r.id, data: r.name })));
    } catch (e) {
      next(e as Error);
    }
  };
}
