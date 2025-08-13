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
  private readonly service: ContractService;

  constructor(service: ContractService) {
    this.service = service;
  }

  // 계약 목록 조회
  getContracts = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const requestUser = req.user as RequestUser;
      const { searchBy, keyword, page, pageSize, grouped } = req.query as {
        searchBy?: ContractSearchBy;
        keyword?: string;
        page?: string;
        pageSize?: string;
        grouped?: string;
      };

      const parsePositiveInt = (value?: string) => {
        if (value == null) return undefined;
        const numeric = Number(value);
        return Number.isFinite(numeric) && numeric > 0 ? numeric : undefined;
      };

      const pageNumber = parsePositiveInt(page);
      const pageSizeNumber = parsePositiveInt(pageSize);
      const wantsGrouped = grouped === undefined || grouped === 'true';

      if (wantsGrouped) {
        const result = await this.service.getContractsGroupedPage(requestUser, {
          searchBy,
          keyword,
          page: pageNumber,
          pageSize: pageSizeNumber,
        });
        res.status(200).json(result.data);
        return;
      }

      const result = await this.service.getContractsPage(requestUser, {
        searchBy,
        keyword,
        page: pageNumber,
        pageSize: pageSizeNumber,
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
      const row = await this.service.getContractById(contractId);

      if (!row) {
        res.status(404).json({ message: '존재하지 않는 계약입니다.' });
        return;
      }

      res.status(200).json(mapContract(row));
    } catch (error) {
      next(error as Error);
    }
  };

  // 계약 등록
  createContract = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const requestUser = req.user as RequestUser;
      const body = req.body as CreateContractDto & {
        userId?: number;
        customerId: number;
        carId: number;
      };

      // 서비스의 시그니처: createContract(createData) 한 개 인수 → 사용자/회사 정보를 합쳐 전달
      const createPayload = {
        ...body,
        userId: requestUser.id,
        companyId: requestUser.companyId,
      };

      const created = await this.service.createContract(createPayload);
      res.status(201).json(mapContract(created));
    } catch (error) {
      next(error as Error);
    }
  };

  // 계약 수정
  updateContract = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const requestUser = req.user as RequestUser;
      const contractId = Number(req.params.contractId);
      const dto = req.body as UpdateContractDto;

      const updated = await this.service.updateContract(requestUser, contractId, dto);
      res.status(200).json(mapContract(updated));
    } catch (error) {
      const casted = error as any;
      if (
        casted?.statusCode === 403 ||
        casted?.code === 'FORBIDDEN_ONLY_OWNER' ||
        casted?.message === '담당자만 수정이 가능합니다'
      ) {
        res.status(403).json({ message: '담당자만 수정이 가능합니다' });
        return;
      }
      if (casted?.statusCode === 404) {
        res.status(404).json({ message: '계약을 찾을 수 없습니다.' });
        return;
      }
      if (casted?.statusCode === 404) {
        res.status(404).json({ message: '계약을 찾을 수 없습니다.' });
      }
    }
  };

  // 계약 삭제
  deleteContract = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const requestUser = req.user as RequestUser;
      const contractId = Number(req.params.contractId);
      await this.service.deleteContract(requestUser, contractId);
      res.status(200).json({ message: 'OK' });
    } catch (error) {
      const casted = error as any;
      if (casted?.statusCode === 403 || casted?.code === 'FORBIDDEN_ONLY_OWNER') {
        res.status(403).json({ message: '담당자만 수정이 가능합니다' });
        return;
      }
      next(error as Error);
    }
  };

  // 계약용 차량 선택 목록
  getContractCars = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const requestUser = req.user as RequestUser;
      const items = await this.service.getContractCars(requestUser);
      res.status(200).json(items);
    } catch (error) {
      next(error as Error);
    }
  };

  // 계약용 고객 선택 목록
  getContractCustomers = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const user = req.user as RequestUser;
      const rows = await this.service.getContractCustomers(user);
      res.status(200).json(
        res.status(200).json(
          rows.map((row) => ({
            id: row.id,
            data: `${row.name}(${row.email})`,
          })),
        ),
      );
    } catch (error) {
      next(error as Error);
    }
  };

  // 계약용 사용자 선택 목록
  getContractUsers = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const requestUser = req.user as RequestUser;
      const rows = await this.service.getContractUsers(requestUser); // { id, name, email }
      res.status(200).json(rows.map((row) => ({ id: row.id, data: row.name })));
    } catch (error) {
      next(error as Error);
    }
  };
}
