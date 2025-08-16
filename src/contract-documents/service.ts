import fs from 'fs/promises';
import path from 'path';
import ContractDocumentsRepository from './repository';

export type DeleteIdsRaw = number | string | number[] | string[] | undefined | null;

export const parseDeleteIds = (raw: DeleteIdsRaw): number[] => {
  if (Array.isArray(raw)) {
    const result: number[] = [];
    for (let i = 0; i < raw.length; i += 1) {
      const n = Number(raw[i] as any);
      if (Number.isInteger(n)) result.push(n);
    }
    return result;
  }
  if (typeof raw === 'number') return [raw];
  if (typeof raw === 'string') {
    const text = raw.trim();
    if (text.startsWith('[')) {
      try {
        const parsed = JSON.parse(text) as unknown[];
        const result: number[] = [];
        for (let i = 0; i < parsed.length; i += 1) {
          const n = Number(parsed[i] as any);
          if (Number.isInteger(n)) result.push(n);
        }
        return result;
      } catch {
        /* ignore */
      }
    }
    const tokens = text.split(',');
    const result: number[] = [];
    for (let i = 0; i < tokens.length; i += 1) {
      const n = Number(tokens[i]!.trim());
      if (Number.isInteger(n)) result.push(n);
    }
    return result;
  }
  return [];
};

const ignoreError = async (p: Promise<unknown>): Promise<void> => {
  try {
    await p;
  } catch {
    /* noop */
  }
};

type ContractListItem = {
  id: number;
  contractName: string;
  resolutionDate: Date | null;
  documentsCount: number;
  manager: string;
  carNumber: string;
  documents: Array<{ id: number; fileName: string }>;
};

export default class ContractDocumentsService {
  private readonly repository: ContractDocumentsRepository;
  private readonly maxUploadCount = 20;

  constructor(repository: ContractDocumentsRepository) {
    this.repository = repository;
  }

  async getDraftContractsForDropdown(input: { keyword?: string; boardOnly?: boolean }) {
    const rows = await this.repository.findContractsForDocumentDropdown(
      input.keyword,
      input.boardOnly !== false,
    );
    return rows.map((r) => {
      const parts: string[] = [];
      if (r.carNumber) parts.push(`[${r.carNumber}]`);
      if (r.customerName) parts.push(r.customerName);
      if (r.model) parts.push(r.model);
      return { id: r.id, data: parts.join(' ') };
    });
  }

  async getContractDocuments(input: {
    page: number;
    pageSize: number;
    searchBy?: string;
    keyword?: string;
  }) {
    const page = Math.max(1, Number(input.page || 1));
    const pageSize = Math.max(1, Math.min(50, Number(input.pageSize || 8)));

    const { documents } = await this.repository.findContractDocuments(
      page,
      pageSize,
      input.keyword,
      input.searchBy,
    );
    const totalItemCount = await this.repository.countDistinctContracts(
      input.keyword,
      input.searchBy,
    );
    const totalPages = Math.max(1, Math.ceil(totalItemCount / pageSize));

    const grouped = new Map<number, ContractListItem>();
    for (let i = 0; i < documents.length; i += 1) {
      const doc = documents[i]!;
      const c = doc.contract!;
      if (!grouped.has(c.id)) {
        grouped.set(c.id, {
          id: c.id,
          contractName: `${c.customer?.name ?? ''} 고객님`.trim(),
          resolutionDate: c.contractDate ?? null,
          documentsCount: 0,
          manager: c.user?.name ?? '',
          carNumber: c.car?.carNumber ?? '',
          documents: [],
        });
      }
      grouped.get(c.id)!.documents.push({
        id: doc.id,
        fileName: doc.documentName ?? doc.fileName ?? '',
      });
    }

    const ids = Array.from(grouped.keys());
    const counts = await Promise.all(ids.map((id) => this.repository.countDocumentsByContract(id)));
    for (let i = 0; i < ids.length; i += 1) grouped.get(ids[i]!)!.documentsCount = counts[i] ?? 0;

    const data: ContractListItem[] = ids.map((id) => grouped.get(id)!);
    return { currentPage: page, totalPages, totalItemCount, data };
  }

  async resolveContractIdFromStrings(strings: string[]): Promise<number | undefined> {
    const nums = new Set<number>();
    for (let i = 0; i < strings.length; i += 1) {
      const s = strings[i];
      if (typeof s === 'string') (s.match(/\d+/g) ?? []).forEach((t) => nums.add(Number(t)));
    }
    const numeric = Array.from(nums).filter((n) => Number.isInteger(n));
    if (numeric.length) {
      const flags = await Promise.all(numeric.map((id) => this.repository.contractExists(id)));
      for (let i = 0; i < flags.length; i += 1) if (flags[i]) return numeric[i]!;
    }

    const cars: string[] = [];
    for (let i = 0; i < strings.length; i += 1) {
      const s = strings[i];
      if (typeof s === 'string') {
        const m = s.match(/\[([^\]]+)\]/);
        if (m?.[1]) cars.push(m[1]);
      }
    }
    if (cars.length) {
      const guesses = await Promise.all(
        cars.map((cn) => this.repository.findLatestContractIdByCarNumber(cn)),
      );
      for (let i = 0; i < guesses.length; i += 1) {
        const id = guesses[i];
        if (typeof id === 'number') return id;
      }
    }
    return undefined;
  }

  async uploadContractDocuments(userId: number, contractId: number, files: Express.Multer.File[]) {
    const exists = await this.repository.contractExists(contractId);
    if (!exists) throw new Error('계약을 찾을 수 없습니다.');
    if (!files?.length) throw new Error('업로드할 파일이 없습니다.');

    const current = await this.repository.countDocumentsByContract(contractId);
    if (current + files.length > this.maxUploadCount) {
      throw new Error(`계약서는 최대 ${this.maxUploadCount}개까지 업로드 가능합니다.`);
    }

    const created = await this.repository.createContractDocuments(contractId, userId, files);
    return { createdCount: created.length, ids: created.map((d) => d.id) };
  }

  private async inferContractId(candidate: number | undefined, deleteIds: number[]) {
    if (typeof candidate === 'number' && Number.isFinite(candidate)) return candidate;
    if (deleteIds?.length) {
      const first = await this.repository.findDocumentById(deleteIds[0]!);
      if (first && typeof first.contractId === 'number') return first.contractId;
    }
    throw new Error('계약 ID가 필요합니다.');
  }

  async editContractDocuments(
    userId: number,
    contractIdRaw: number | undefined,
    deleteDocumentIds: number[],
    newFiles: Express.Multer.File[],
  ) {
    const contractId = await this.inferContractId(contractIdRaw, deleteDocumentIds);
    const exists = await this.repository.contractExists(contractId);
    if (!exists) throw new Error('계약을 찾을 수 없습니다.');

    if (deleteDocumentIds.length) {
      const docs = await this.repository.findDocumentsByIds(deleteDocumentIds);
      for (let i = 0; i < docs.length; i += 1) {
        if (docs[i]!.contractId !== contractId)
          throw new Error('삭제 대상에 다른 계약 문서가 포함되어 있습니다.');
      }
      await Promise.all(docs.map((d) => ignoreError(fs.unlink(d.filePath))));
      const deleted = await this.repository.deleteDocumentsOfContract(
        contractId,
        deleteDocumentIds,
      );
      if (!deleted) throw new Error('삭제할 문서를 찾을 수 없습니다.');
    }

    if (newFiles?.length) {
      const current = await this.repository.countDocumentsByContract(contractId);
      const afterDelete = current - deleteDocumentIds.length;
      if (afterDelete + newFiles.length > this.maxUploadCount) {
        throw new Error(`계약서는 최대 ${this.maxUploadCount}개까지 업로드 가능합니다.`);
      }
      await this.repository.createContractDocuments(contractId, userId, newFiles);
    }
  }

  async getDocumentForDownload(id: number) {
    const row = await this.repository.findDocumentById(id);
    if (!row) {
      const err = new Error('문서를 찾을 수 없습니다.');
      (err as any).name = 'NotFoundError';
      throw err;
    }
    return {
      filePath: row.filePath,
      fileName: row.documentName ?? row.fileName ?? path.basename(row.filePath),
      fileType: (row as any).fileType ?? 'application/octet-stream',
    };
  }

  async createZipForDocuments(documentIds: number[]) {
    if (!documentIds?.length) throw new Error('선택한 문서가 없습니다.');
    const docs = await this.repository.findDocumentsByIds(documentIds);
    if (!docs.length) throw new Error('다운로드할 문서를 찾을 수 없습니다.');
    const names = docs.map((d) => path.basename(d.filePath));
    const buffer = Buffer.from(names.join('\n'), 'utf-8');
    return { buffer, fileName: 'documents.zip' };
  }
}
