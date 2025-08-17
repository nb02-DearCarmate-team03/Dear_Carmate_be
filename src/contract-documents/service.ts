/* eslint-disable */
import { ContractDocument } from '@prisma/client';
import * as path from 'path';
import * as fs from 'fs/promises';
import archiver from 'archiver';
import ContractDocumentsRepository, { DraftContractRow } from './repository';
import GetContractDocumentsDto from './dto/get-contract-documents.dto';
import EmailService from '../common/email.service';
import { NotFoundError } from '../common/errors/not-found-error';
import { BadRequestError } from '../common/errors/bad-request-error';

/** ---------- 헬퍼(클래스 밖) ---------- */

const trimOrEmpty = (v?: string | null): string => (typeof v === 'string' ? v.trim() : '');

const pickName = (documentName?: string | null, fileName?: string | null, fallback = ''): string => {
  const a = trimOrEmpty(documentName);
  if (a) return a;
  const b = trimOrEmpty(fileName);
  if (b) return b;
  return fallback;
};

const toDateString = (d: Date | null | undefined): string => {
  if (!(d instanceof Date)) return '';
  const iso = d.toISOString();
  const i = iso.indexOf('T');
  return i >= 0 ? iso.slice(0, i) : iso;
};

const buildLabel = (r: DraftContractRow): string => {
  const carNumber = r.car?.carNumber ?? '';
  const model = r.car?.model ?? '';
  const name = r.customer?.name ?? '';
  const parts: string[] = [];
  if (carNumber) parts.push(`[${carNumber}]`);
  if (name) parts.push(name);
  if (model) parts.push(model);
  return parts.join(' ').trim();
};

interface ContractDocumentWithRelations extends ContractDocument {
  contract: {
    id: number;
    contractDate: Date | null;
    user: { name: string } | null;
    car: { carNumber: string } | null;
    customer: { email: string | null; name: string | null } | null;
  } | null;
}

interface DocumentListItem {
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
  documents: DocumentListItem[];
}

interface PaginatedResult {
  currentPage: number;
  totalPages: number;
  totalItemCount: number;
  data: ContractDocumentListItem[];
}

/** ---------- 서비스 구현 ---------- */

export default class ContractDocumentsService {
  private readonly emailService: EmailService;

  private readonly allowedExtensions = ['.pdf', '.doc', '.docx', '.jpg', '.jpeg', '.png', '.csv'];

  private readonly maxFileSize = 10 * 1024 * 1024; // 10MB

  private readonly maxFileCount = 10;

  constructor(private readonly repo: ContractDocumentsRepository) {
    this.emailService = new EmailService();
  }

  /** 목록 */
  async getContractDocuments(companyId: number, dto: GetContractDocumentsDto): Promise<PaginatedResult> {
    const { page = 1, pageSize = 8, keyword, searchBy } = dto;

    const { documents, total } = await this.repo.findContractDocuments(
      companyId,
      page,
      pageSize,
      keyword,
      searchBy,
    );

    const grouped = this.groupByContract(documents as ContractDocumentWithRelations[]);
    const data = this.formatList(grouped);

    return {
      currentPage: page,
      totalPages: Math.ceil(total / pageSize),
      totalItemCount: total,
      data,
    };
  }

  /** 업로드 */
  async uploadContractDocuments(
    companyId: number,
    userId: number,
    contractId: number,
    files: Express.Multer.File[],
  ): Promise<{ contractDocumentId: number }> {
    const uploadedFilePaths: string[] = [];
    let saved: ContractDocument[] = [];

    try {
      this.validateFiles(files);

      const contract = await this.repo.findContractById(contractId, companyId);
      if (!contract) throw new NotFoundError('계약을 찾을 수 없습니다.');

      const existing = await this.repo.countDocumentsByContract(contractId);
      if (existing + files.length > this.maxFileCount) {
        throw new BadRequestError(`계약서는 최대 ${this.maxFileCount}개까지 업로드 가능합니다.`);
      }

      // 실제 저장 확인
      for (const f of files) {
        try {
          // eslint-disable-next-line no-await-in-loop
          await fs.access(f.path);
          uploadedFilePaths.push(f.path);
        } catch {
          throw new Error(`파일 저장 실패: ${f.originalname}`);
        }
      }

      try {
        saved = await this.repo.createContractDocuments(contractId, userId, files);
      } catch {
        await this.cleanupFiles(uploadedFilePaths);
        throw new Error('데이터베이스 저장 중 오류가 발생했습니다.');
      }

      if (!saved.length || !saved[0]) {
        await this.cleanupFiles(uploadedFilePaths);
        throw new Error('계약 문서 저장에 실패했습니다.');
      }

      // 이메일(부가 기능)
      if (contract.customer?.email) {
        try {
          await this.sendContractEmail(contract as any, files);
        } catch (e) {
          // 이메일 실패는 무시
          // eslint-disable-next-line no-console
          console.error('이메일 발송 실패:', e);
        }
      }

      return { contractDocumentId: saved[0].id };
    } catch (err) {
      if (uploadedFilePaths.length) await this.cleanupFiles(uploadedFilePaths);
      if (saved.length) {
        const ids = saved.map((d) => d.id);
        try {
          await this.repo.deleteDocuments(ids, companyId);
        } catch (rollbackError) {
          // eslint-disable-next-line no-console
          console.error('데이터베이스 롤백 실패:', rollbackError);
        }
      }
      throw err;
    }
  }

  /** 수정(삭제/추가) */
  async editContractDocuments(
    companyId: number,
    userId: number,
    contractId: number,
    deleteDocumentIds?: number[],
    newFiles?: Express.Multer.File[],
  ): Promise<void> {
    const contract = await this.repo.findContractById(contractId, companyId);
    if (!contract) throw new NotFoundError('계약을 찾을 수 없습니다.');

    // 삭제
    const ids = Array.isArray(deleteDocumentIds)
      ? Array.from(new Set(deleteDocumentIds.filter((n) => Number.isInteger(n) && n > 0)))
      : [];

    if (ids.length) {
      const docs = await this.repo.findDocumentsByIds(ids, companyId);
      const invalid = docs.filter((d) => d.contractId !== contractId);
      if (invalid.length) throw new BadRequestError('삭제하려는 문서가 해당 계약과 연결되어 있지 않습니다.');

      await Promise.all(docs.map((d) => this.deleteFile(d.filePath)));
      const deleted = await this.repo.deleteDocuments(ids, companyId);
      if (deleted === 0) throw new NotFoundError('삭제할 문서를 찾을 수 없습니다.');
    }

    // 추가
    if (newFiles && newFiles.length) {
      this.validateFiles(newFiles);
      const current = await this.repo.countDocumentsByContract(contractId);
      const remain = current - ids.length;
      if (remain + newFiles.length > this.maxFileCount) {
        throw new BadRequestError(`계약서는 최대 ${this.maxFileCount}개까지 업로드 가능합니다.`);
      }
      await this.repo.createContractDocuments(contractId, userId, newFiles);
    }
  }

  /** 단일 다운로드용 메타 */
  async getDocumentForDownload(
    companyId: number,
    contractDocumentId: number,
  ): Promise<{ filePath: string; fileName: string; fileType: string }> {
    const doc = await this.repo.findDocumentById(contractDocumentId, companyId);
    if (!doc) throw new NotFoundError('문서를 찾을 수 없습니다.');

    const fileName = pickName((doc as any).documentName, doc.fileName, 'download');
    const ext = path.extname(doc.fileName ?? fileName).toLowerCase();

    let fileType = 'application/octet-stream';
    if (ext === '.pdf') fileType = 'application/pdf';
    else if (ext === '.doc') fileType = 'application/msword';
    else if (ext === '.docx') fileType = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
    else if (ext === '.jpg' || ext === '.jpeg') fileType = 'image/jpeg';
    else if (ext === '.png') fileType = 'image/png';
    else if (ext === '.csv') fileType = 'text/csv';

    // 존재 확인
    try {
      await fs.access(doc.filePath);
    } catch {
      throw new NotFoundError('파일을 찾을 수 없습니다.');
    }

    return { filePath: doc.filePath, fileName, fileType };
  }

  /** ZIP */
  async downloadMultipleDocuments(companyId: number, ids: number[]): Promise<Buffer> {
    if (!ids?.length) throw new BadRequestError('다운로드할 문서를 선택해주세요.');

    const docs = await this.repo.findDocumentsByIds(ids, companyId);
    if (!docs.length) throw new NotFoundError('문서를 찾을 수 없습니다.');

    const valid: ContractDocument[] = [];
    for (const d of docs) {
      try {
        // eslint-disable-next-line no-await-in-loop
        await fs.access(d.filePath);
        valid.push(d as any);
      } catch {
        // eslint-disable-next-line no-console
        console.error(`파일을 찾을 수 없음: ${d.filePath}`);
      }
    }
    if (!valid.length) throw new NotFoundError('다운로드 가능한 파일이 없습니다.');

    return this.createZipFile(valid);
  }

  /** 드래프트 라벨 목록 (프런트 드롭다운) */
  async getDraftContracts(companyId: number) {
    const rows = await this.repo.findDraftContracts(companyId);
    return rows.map((r) => ({ id: r.id, name: buildLabel(r) }));
  }

  /** 동일하지만 data 키를 쓰는 스펙 */
  async getDraftContractsForDropdown(companyId: number): Promise<Array<{ id: number; data: string }>> {
    const rows = await this.repo.findDraftContracts(companyId);
    return rows.map((r) => ({ id: r.id, data: buildLabel(r) }));
  }

  /** 드래프트 자동 선택 후보 */
  async resolveContractIdForUpload(companyId: number, userId: number): Promise<number | null> {
    const drafts = await this.repo.findDraftContracts(companyId);
    if (!Array.isArray(drafts) || drafts.length === 0) return null;

    const mine = drafts.filter((d) => d.userId === userId);
    if (mine.length >= 1) return mine[0]?.id ?? null;

    return drafts[0]?.id ?? null;
  }

  /** ---------------- 내부 유틸 ---------------- */

  private validateFiles(files: Express.Multer.File[]): void {
    for (const f of files) {
      const ext = path.extname(f.originalname).toLowerCase();
      if (!this.allowedExtensions.includes(ext)) {
        throw new BadRequestError(`허용되지 않은 파일 형식입니다: ${ext}`);
      }
      if (f.size > this.maxFileSize) {
        throw new BadRequestError(`파일 크기는 10MB를 초과할 수 없습니다: ${f.originalname}`);
      }
    }
  }

  private async cleanupFiles(filePaths: string[]): Promise<void> {
    const errors: Error[] = [];
    for (const p of filePaths) {
      try {
        // eslint-disable-next-line no-await-in-loop
        await fs.unlink(p);
      } catch (e) {
        // eslint-disable-next-line no-console
        console.error(`파일 삭제 실패: ${p}`, e);
        errors.push(e as Error);
      }
    }
    if (errors.length) {
      // eslint-disable-next-line no-console
      console.error(`${errors.length}개의 파일 삭제 실패`);
    }
  }

  private groupByContract(docs: ContractDocumentWithRelations[]) {
    const m = new Map<number, ContractDocumentWithRelations[]>();
    for (const doc of docs) {
      const id = doc.contractId;
      const arr = m.get(id);
      if (arr) arr.push(doc);
      else m.set(id, [doc]);
    }
    return m;
  }

  private formatList(grouped: Map<number, ContractDocumentWithRelations[]>): ContractDocumentListItem[] {
    const out: ContractDocumentListItem[] = [];

    for (const [contractId, docs] of grouped) {
      if (!docs || docs.length === 0) continue;

      const first = docs[0]!;
      const contractName = pickName((first as any).documentName, first.fileName, `계약서_${contractId}`);
      const resolutionDate = toDateString(first.contract?.contractDate);

      const documents = docs.map((d) => ({
        id: d.id,
        fileName: pickName((d as any).documentName, d.fileName, ''),
      }));

      out.push({
        id: contractId,
        contractName,
        resolutionDate,
        documentsCount: docs.length,
        manager: trimOrEmpty(first.contract?.user?.name) || '',
        carNumber: trimOrEmpty(first.contract?.car?.carNumber) || '',
        documents,
      });
    }

    return out;
  }

  private async createZipFile(docs: ContractDocument[]): Promise<Buffer> {
    const archive = archiver('zip', { zlib: { level: 9 } });
    const chunks: Buffer[] = [];

    return new Promise((resolve, reject) => {
      archive.on('data', (c) => chunks.push(c));
      archive.on('end', () => resolve(Buffer.concat(chunks)));
      archive.on('error', reject);

      (async () => {
        for (const d of docs) {
          try {
            // eslint-disable-next-line no-await-in-loop
            const buf = await fs.readFile(d.filePath);
            archive.append(buf, { name: d.fileName });
          } catch (e) {
            // eslint-disable-next-line no-console
            console.error(`파일 읽기 실패: ${d.filePath}`, e);
          }
        }
        await archive.finalize();
      })();
    });
  }

  private async deleteFile(filePath: string): Promise<void> {
    try {
      await fs.unlink(filePath);
    } catch (e) {
      // eslint-disable-next-line no-console
      console.error(`파일 삭제 실패: ${filePath}`, e);
    }
  }

  private async sendContractEmail(contract: any, files: Express.Multer.File[]): Promise<void> {
    const subject = `[계약서] ${contract.car.carNumber} 차량 계약서가 도착했습니다.`;
    const html = `
      <h2>안녕하세요, ${contract.customer.name}님</h2>
      <p>${contract.car.carNumber} 차량의 계약서가 등록되었습니다.</p>
      <p>첨부된 계약서를 확인해주세요.</p>
      <br/>
      <p>감사합니다.</p>
    `;
    const attachments = files.map((f) => ({ filename: f.originalname, path: f.path }));
    await this.emailService.sendEmail(contract.customer.email, subject, html, attachments);
  }
}
