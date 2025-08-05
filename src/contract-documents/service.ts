/* eslint-disable */
import { ContractDocument } from '@prisma/client';
import * as path from 'path';
import * as fs from 'fs/promises';
import archiver from 'archiver';
import { Readable } from 'stream';
import ContractDocumentsRepository from './repository';
import GetContractDocumentsDto from './dto/get-contract-documents.dto';
import { BadRequestError, NotFoundError } from '../common/utils/custom-errors';
import EmailService from '../common/email.service';

interface ContractDocumentWithRelations extends ContractDocument {
  contract: {
    id: number;
    contractDate: Date | null;
    user: {
      name: string;
    };
    car: {
      carNumber: string;
    };
    customer: {
      email: string;
      name: string;
    };
  };
}

interface Document {
  id: number;
  fileName: string;
}

interface ContractDocumentListItem {
  id: number;
  contractName: string;
  resolutionDate: string;
  documentsCount: number;
  manager: string;
  carNumber: string;
  documents: Document[];
}

interface PaginatedResult {
  currentPage: number;
  totalPages: number;
  totalItemCount: number;
  data: ContractDocumentListItem[];
}

export default class ContractDocumentsService {
  private readonly emailService: EmailService;
  private readonly allowedExtensions = ['.pdf', '.doc', '.docx', '.jpg', '.jpeg', '.png'];
  private readonly maxFileSize = 10 * 1024 * 1024; // 10MB
  private readonly maxFileCount = 10;

  constructor(private readonly contractDocumentsRepository: ContractDocumentsRepository) {
    this.emailService = new EmailService();
  }

  async getContractDocuments(
    companyId: number,
    dto: GetContractDocumentsDto,
  ): Promise<PaginatedResult> {
    const { page = 1, pageSize = 10, keyword, searchBy } = dto;
    const offset = (page - 1) * pageSize;

    const { documents, total } = await this.contractDocumentsRepository.findContractDocuments(
      companyId,
      page,
      pageSize,
      keyword,
      searchBy,
    );

    const groupedDocuments = this.groupDocumentsByContract(documents);
    const data = this.formatContractDocumentList(groupedDocuments);

    return {
      currentPage: page,
      totalPages: Math.ceil(total / pageSize),
      totalItemCount: total,
      data,
    };
  }

  async uploadContractDocuments(
    companyId: number,
    userId: number,
    contractId: number,
    files: Express.Multer.File[],
  ): Promise<{ contractDocumentId: number }> {
    // 파일 유효성 검증
    this.validateFiles(files);

    // 계약 존재 여부 확인
    const contract = await this.contractDocumentsRepository.findContractById(contractId, companyId);
    if (!contract) {
      throw new NotFoundError('계약을 찾을 수 없습니다.');
    }

    // 기존 문서 개수 확인
    const existingCount =
      await this.contractDocumentsRepository.countDocumentsByContract(contractId);
    if (existingCount + files.length > this.maxFileCount) {
      throw new BadRequestError(`계약서는 최대 ${this.maxFileCount}개까지 업로드 가능합니다.`);
    }

    // 트랜잭션으로 문서 저장
    const savedDocuments = await this.contractDocumentsRepository.createContractDocuments(
      contractId,
      userId,
      files,
    );

    // 이메일 발송
    if (contract.customer?.email) {
      await this.sendContractEmail(contract, files);
    }
    if (!savedDocuments[0]) {
      throw new Error('저장된 계약 문서가 없습니다.');
    }
    return { contractDocumentId: savedDocuments[0].id };
  }

  async getDocumentForDownload(companyId: number, documentId: number): Promise<ContractDocument> {
    const document = await this.contractDocumentsRepository.findDocumentById(documentId, companyId);
    if (!document) {
      throw new NotFoundError('계약서를 찾을 수 없습니다.');
    }

    // 파일 존재 여부 확인
    try {
      await fs.access(document.filePath);
    } catch {
      throw new NotFoundError('파일을 찾을 수 없습니다.');
    }

    return document;
  }

  async downloadMultipleDocuments(companyId: number, documentIds: number[]): Promise<Buffer> {
    const documents = await this.contractDocumentsRepository.findDocumentsByIds(
      documentIds,
      companyId,
    );

    if (documents.length === 0) {
      throw new NotFoundError('다운로드할 계약서가 없습니다.');
    }

    return this.createZipFile(documents);
  }

  async editContractDocuments(
    companyId: number,
    userId: number,
    contractId: number,
    deleteDocumentIds?: number[],
    newFiles?: Express.Multer.File[],
  ): Promise<void> {
    const contract = await this.contractDocumentsRepository.findContractById(contractId, companyId);
    if (!contract) {
      throw new NotFoundError('계약을 찾을 수 없습니다.');
    }

    // 삭제 처리
    if (deleteDocumentIds && deleteDocumentIds.length > 0) {
      const documentsToDelete = await this.contractDocumentsRepository.findDocumentsByIds(
        deleteDocumentIds,
        companyId,
      );

      // 계약과 연결된 문서인지 확인
      const invalidDocuments = documentsToDelete.filter((doc) => doc.contractId !== contractId);
      if (invalidDocuments.length > 0) {
        throw new BadRequestError('삭제하려는 문서가 해당 계약과 연결되어 있지 않습니다.');
      }

      // 파일 시스템에서 파일 삭제
      await Promise.all(documentsToDelete.map((doc) => this.deleteFile(doc.filePath)));

      // DB에서 삭제 (soft delete)
      await this.contractDocumentsRepository.deleteDocuments(deleteDocumentIds);
    }

    // 새 파일 추가
    if (newFiles && newFiles.length > 0) {
      this.validateFiles(newFiles);

      const currentCount =
        await this.contractDocumentsRepository.countDocumentsByContract(contractId);
      const deleteCount = deleteDocumentIds?.length || 0;
      const remainingCount = currentCount - deleteCount;

      if (remainingCount + newFiles.length > this.maxFileCount) {
        throw new BadRequestError(`계약서는 최대 ${this.maxFileCount}개까지 업로드 가능합니다.`);
      }

      await this.contractDocumentsRepository.createContractDocuments(contractId, userId, newFiles);
    }
  }

  private validateFiles(files: Express.Multer.File[]): void {
    for (const file of files) {
      // 확장자 검증
      const ext = path.extname(file.originalname).toLowerCase();
      if (!this.allowedExtensions.includes(ext)) {
        throw new BadRequestError(`허용되지 않은 파일 형식입니다: ${ext}`);
      }

      // 파일 크기 검증
      if (file.size > this.maxFileSize) {
        throw new BadRequestError(`파일 크기는 10MB를 초과할 수 없습니다: ${file.originalname}`);
      }
    }
  }

  private groupDocumentsByContract(
    documents: ContractDocumentWithRelations[],
  ): Map<number, ContractDocumentWithRelations[]> {
    const grouped = new Map<number, ContractDocumentWithRelations[]>();

    for (const doc of documents) {
      const { contractId } = doc;
      if (!grouped.has(contractId)) {
        grouped.set(contractId, []);
      }
      grouped.get(contractId)!.push(doc);
    }

    return grouped;
  }

  private formatContractDocumentList(
    groupedDocuments: Map<number, ContractDocumentWithRelations[]>,
  ): ContractDocumentListItem[] {
    const result: ContractDocumentListItem[] = [];

    for (const [contractId, docs] of groupedDocuments) {
      const firstDoc = docs[0];
      if (!firstDoc) {
        continue; // 또는 throw new Error('문서 없음');
      }
      const contractName = firstDoc.documentName || `계약서_${contractId}`;
      const documents = docs.map((doc) => ({
        id: doc.id,
        fileName: doc.fileName,
      }));

      result.push({
        id: contractId,
        contractName,
        resolutionDate: firstDoc.contract.contractDate?.toISOString().split('T')[0] ?? '', //  null 또는 undefined일 경우 '' 반환
        documentsCount: docs.length,
        manager: firstDoc.contract.user.name,
        carNumber: firstDoc.contract.car.carNumber,
        documents: documents,
      });
    }

    return result;
  }

  private async createZipFile(documents: ContractDocument[]): Promise<Buffer> {
    const archive = archiver('zip', { zlib: { level: 9 } });
    const chunks: Buffer[] = [];

    return new Promise((resolve, reject) => {
      archive.on('data', (chunk) => chunks.push(chunk));
      archive.on('end', () => resolve(Buffer.concat(chunks)));
      archive.on('error', reject);

      (async () => {
        for (const doc of documents) {
          try {
            const fileBuffer = await fs.readFile(doc.filePath);
            archive.append(fileBuffer, { name: doc.fileName });
          } catch (error) {
            console.error(`파일 읽기 실패: ${doc.filePath}`, error);
          }
        }
        await archive.finalize();
      })();
    });
  }

  private async deleteFile(filePath: string): Promise<void> {
    try {
      await fs.unlink(filePath);
    } catch (error) {
      console.error(`파일 삭제 실패: ${filePath}`, error);
    }
  }

  private async sendContractEmail(contract: any, files: Express.Multer.File[]): Promise<void> {
    const subject = `[계약서] ${contract.car.carNumber} 차량 계약서가 도착했습니다.`;
    const html = `
      <h2>안녕하세요, ${contract.customer.name}님</h2>
      <p>${contract.car.carNumber} 차량의 계약서가 등록되었습니다.</p>
      <p>첨부된 계약서를 확인해주세요.</p>
      <br>
      <p>감사합니다.</p>
    `;

    const attachments = files.map((file) => ({
      filename: file.originalname,
      path: file.path,
    }));

    await this.emailService.sendEmail(contract.customer.email, subject, html, attachments);
  }
}
