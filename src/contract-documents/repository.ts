/* eslint-disable */
import {
  PrismaClient,
  Prisma,
  ContractDocument,
  ContractStatus as PrismaContractStatus,
} from '@prisma/client';
import * as path from 'path';
import { toUtf8Filename, sanitizeFilename } from '../common/utils/filename';

/** 목록/집계에서 쓰는 리턴 타입 (relations 포함) */
export interface ContractDocumentWithRelations extends ContractDocument {
  contract: {
    id: number;
    contractDate: Date | null;
    user: { name: string };
    car: { carNumber: string };
    customer: { email: string; name: string } | null;
  };
}

/** 업로드 자동 대상 결정을 위한 드래프트 행 */
export type DraftContractRow = Prisma.ContractGetPayload<{
  select: {
    id: true;
    userId: true;
    updatedAt: true;
    car: { select: { carNumber: true; model: true } };
    customer: { select: { name: true } };
  };
}>;

export default class ContractDocumentsRepository {
  constructor(private readonly prisma: PrismaClient) {}

  // ────────────────────────────────────────────────────────────────────────────────
  // 목록 조회(페이지네이션 + 검색)
  // ────────────────────────────────────────────────────────────────────────────────
  async findContractDocuments(
    companyId: number,
    page: number,
    pageSize: number,
    keyword?: string,
    searchBy?: string, // 'contractName' | 'userName' | 'carNumber'
  ): Promise<{ documents: ContractDocumentWithRelations[]; total: number }> {
    let where: Prisma.ContractDocumentWhereInput = {
      deletedAt: null,
      contract: { companyId, deletedAt: null },
    };

    const q = (keyword ?? '').trim();
    if (q && searchBy) {
      if (searchBy === 'contractName') {
        // 화면 표시용 문서명(documentName)으로 검색
        where = {
          deletedAt: null,
          documentName: { contains: q },
          contract: { companyId, deletedAt: null },
        };
      } else if (searchBy === 'userName') {
        where = {
          deletedAt: null,
          contract: {
            companyId,
            deletedAt: null,
            user: { name: { contains: q } },
          },
        };
      } else if (searchBy === 'carNumber') {
        where = {
          deletedAt: null,
          contract: {
            companyId,
            deletedAt: null,
            car: { carNumber: { contains: q } },
          },
        };
      }
    }

    const [documents, total] = await this.prisma.$transaction([
      this.prisma.contractDocument.findMany({
        where,
        include: {
          contract: {
            include: {
              user: { select: { name: true } },
              car: { select: { carNumber: true } },
              customer: { select: { email: true, name: true } },
            },
          },
        },
        skip: (page - 1) * pageSize,
        take: Number(pageSize),
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.contractDocument.count({ where }),
    ]);

    return { documents: documents as ContractDocumentWithRelations[], total };
  }

  // ────────────────────────────────────────────────────────────────────────────────
  // 계약 단건 조회(회사 스코프)
  // ────────────────────────────────────────────────────────────────────────────────
  async findContractById(contractId: number, companyId: number) {
    return this.prisma.contract.findFirst({
      where: { id: contractId, companyId, deletedAt: null },
      include: {
        car: { select: { carNumber: true } },
        customer: { select: { email: true, name: true } },
      },
    });
  }

  // ────────────────────────────────────────────────────────────────────────────────
  // 계약별 문서 개수
  // ────────────────────────────────────────────────────────────────────────────────
  async countDocumentsByContract(contractId: number): Promise<number> {
    return this.prisma.contractDocument.count({
      where: { contractId, deletedAt: null },
    });
  }

  // ────────────────────────────────────────────────────────────────────────────────
  // 문서 생성(멀티 파일)
  //  - 화면 표시에 사용할 이름(documentName)은 '원본명 복원 + 정제'
  //  - 저장 파일명(fileName)은 디스크 저장명(없으면 path/표시명 기반) + 정제
  // ────────────────────────────────────────────────────────────────────────────────
  async createContractDocuments(
    contractId: number,
    userId: number,
    files: Express.Multer.File[],
  ): Promise<ContractDocument[]> {
    return this.prisma.$transaction(async (tx) => {
      const documents = await Promise.all(
        files.map(async (file) => {
          const original = file.originalname ?? '';
          const displayName = sanitizeFilename(toUtf8Filename(original));

          const storedName = sanitizeFilename(
            file.filename ??
              (file.path ? path.basename(file.path) : displayName) ??
              displayName,
          );

          return tx.contractDocument.create({
            data: {
              contractId,
              documentName: displayName, // 화면 표시용 이름
              fileName: storedName, // 저장 파일명
              filePath: file.path,
              fileSize: file.size,
              fileType: file.mimetype,
              uploadedBy: userId, // 스키마에 맞춰 필드명 사용
            },
          });
        }),
      );

      return documents;
    });
  }

  // ────────────────────────────────────────────────────────────────────────────────
  // 문서 단건 조회(회사 스코프)
  // ────────────────────────────────────────────────────────────────────────────────
  async findDocumentById(
    documentId: number,
    companyId: number,
  ): Promise<ContractDocument | null> {
    return this.prisma.contractDocument.findFirst({
      where: {
        id: documentId,
        deletedAt: null,
        contract: { companyId, deletedAt: null },
      },
    });
  }

  // ────────────────────────────────────────────────────────────────────────────────
  // 문서 여러 개 조회(회사 스코프) – 삭제/ZIP 생성 등에 사용
  // ────────────────────────────────────────────────────────────────────────────────
  async findDocumentsByIds(ids: number[], companyId: number) {
    return this.prisma.contractDocument.findMany({
      where: {
        id: { in: ids },
        deletedAt: null,
        contract: { companyId },
      },
      select: { id: true, contractId: true, filePath: true },
    });
  }

  // ────────────────────────────────────────────────────────────────────────────────
  // 업로드 대상 드래프트 목록(가장 최근순)
  // ────────────────────────────────────────────────────────────────────────────────
  async findDraftContracts(companyId: number): Promise<DraftContractRow[]> {
    return this.prisma.contract.findMany({
      where: {
        companyId,
        deletedAt: null,
        status: PrismaContractStatus.CONTRACT_DRAFT,
      },
      select: {
        id: true,
        userId: true,
        updatedAt: true,
        car: { select: { carNumber: true, model: true } },
        customer: { select: { name: true } },
      },
      orderBy: { updatedAt: 'desc' },
    });
  }

  // ────────────────────────────────────────────────────────────────────────────────
  // 소프트 삭제 (deletedAt 세팅) – 회사 스코프 검증 포함
  // ────────────────────────────────────────────────────────────────────────────────
  async deleteDocuments(ids: number[], companyId: number): Promise<number> {
    if (!ids.length) return 0;

    // 회사 소속 & 미삭제인 것만 허용
    const allowed = await this.prisma.contractDocument.findMany({
      where: { id: { in: ids }, deletedAt: null, contract: { companyId } },
      select: { id: true },
    });

    const allowedIds = allowed.map((d) => d.id);
    if (!allowedIds.length) return 0;

    const result = await this.prisma.contractDocument.updateMany({
      where: { id: { in: allowedIds }, deletedAt: null },
      data: { deletedAt: new Date() },
    });

    return result.count;
  }
}
