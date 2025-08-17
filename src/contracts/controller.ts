// src/contracts/controller.ts
import { Request, Response, NextFunction } from 'express';
import { ContractService } from './service';
import { CreateContractDto } from './dto/create-contract.dto';
import { UpdateContractDto } from './dto/update-contract.dto';
import { mapContract } from './contract.mapper';
import { ContractSearchBy } from './repository';

type RequestUser = {
  id: number;
  companyId: number;
  name: string;
  email: string;
  isAdmin: boolean;
};

export default class ContractController {
  // ✅ 클래스 필드로 명확히 선언
  private readonly service: ContractService;

  // ✅ 타입도 올바르게 지정
  constructor(service: ContractService) {
    this.service = service;
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
        grouped?: string; // 'true' | 'false' | undefined
      };

      const toPosInt = (v?: string) => {
        if (v == null) return undefined;
        const n = Number(v);
        return Number.isFinite(n) && n > 0 ? n : undefined;
      };

      const pageNum = toPosInt(page);
      const sizeNum = toPosInt(pageSize);
      const wantsGrouped = grouped === undefined || grouped === 'true';

      if (wantsGrouped) {
        const result = await this.service.getContractsGroupedPage(user, {
          searchBy,
          keyword,
          page: pageNum,
          pageSize: sizeNum,
        });
        res.status(200).json(result.data);
        return;
      }

      const result = await this.service.getContractsPage(user, {
        searchBy,
        keyword,
        page: pageNum,
        pageSize: sizeNum,
      });
      res.status(200).json(result);
    } catch (e) {
      next(e as Error);
    }
  };

  // 계약 단건 조회
  getContract = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const contractId = Number(req.params.contractId);
      const row = await this.service.getContractById(contractId);
      if (!row) {
        res.status(404).json({ message: '존재하지 않는 계약입니다.' });
        return;
      }
      res.status(200).json(mapContract(row));
    } catch (e) {
      next(e as Error);
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
      const created = await this.service.createContract(user, body);
      res.status(201).json(mapContract(created));
    } catch (e) {
      next(e as Error);
    }
  };

  // 계약 수정
  updateContract = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const user = req.user as RequestUser;
      const contractId = Number(req.params.contractId);
      const dto = req.body as UpdateContractDto;

      const updated = await this.service.updateContract(user, contractId, dto);
      res.status(200).json(mapContract(updated));
    } catch (err) {
      const e: any = err;
      if (
        e?.statusCode === 403 ||
        e?.code === 'FORBIDDEN_ONLY_OWNER' ||
        e?.message === '담당자만 수정이 가능합니다'
      ) {
        res.status(403).json({ message: '담당자만 수정이 가능합니다' });
        return;
      }
      if (e?.statusCode === 404) {
        res.status(404).json({ message: '계약을 찾을 수 없습니다.' });
        return;
      }
      next(err as Error);
    }
  };

  // 계약 삭제
  deleteContract = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const user = req.user as RequestUser;
      const contractId = Number(req.params.contractId);
      await this.service.deleteContract(user, contractId);
      res.status(200).json({ message: 'OK' });
    } catch (e) {
      const err: any = e;
      if (err?.statusCode === 403 || err?.code === 'FORBIDDEN_ONLY_OWNER') {
        res.status(403).json({ message: '담당자만 수정이 가능합니다' });
        return;
      }
      next(e as Error);
    }
  };

  // 계약용 차량 선택 목록 (서비스가 이미 {id, data}로 반환)
  getContractCars = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const user = req.user as RequestUser;
      const items = await this.service.getContractCars(user);
      res.status(200).json(items);
    } catch (e) {
      next(e as Error);
    }
  };

  // 계약용 고객 선택 목록 → "이름(email)" 포맷
  getContractCustomers = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const user = req.user as RequestUser;
      const rows = await this.service.getContractCustomers(user); // {id, name, email}
      res.status(200).json(rows.map((r) => ({ id: r.id, data: `${r.name}(${r.email})` })));
    } catch (e) {
      next(e as Error);
    }
  };

  // 계약용 사용자 선택 목록 → "이름(email)" 포맷
  getContractUsers = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const user = req.user as RequestUser;
      const rows = await this.service.getContractUsers(user); // {id, name, email}
      res.status(200).json(rows.map((r) => ({ id: r.id, data: `${r.name}(${r.email})` })));
    } catch (e) {
      next(e as Error);
    }
  };
}
