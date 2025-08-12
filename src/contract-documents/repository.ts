import { PrismaClient, ContractDocument, Prisma } from '@prisma/client';

interface ContractWithCustomer {
  id: number;
  contractDate: Date | null;
  car: {
    carNumber: string;
  };
  customer: {
    email: string;
    name: string;
  } | null;
}

export default class ContractDocumentsRepository {
  // eslint-disable-next-line no-empty-function
  constructor(private readonly prisma: PrismaClient) {}

  async findContractDocuments(
    companyId: number,
    page: number,
    pageSize: number,
    keyword?: string,
    searchBy?: string,
  ): Promise<{ documents: any[]; total: number }> {
    let where: Prisma.ContractDocumentWhereInput = {
      deletedAt: null,
      contract: {
        companyId,
        deletedAt: null,
      },
    };

    // 검색 조건 추가
    if (keyword && typeof keyword === 'string' && keyword.trim() && searchBy) {
      const trimmedKeyword = keyword.trim();

      if (searchBy === 'contractName') {
        where = {
          deletedAt: null,
          documentName: {
            contains: trimmedKeyword,
          },
          contract: {
            companyId,
            deletedAt: null,
          },
        };
      } else if (searchBy === 'userName') {
        where = {
          deletedAt: null,
          contract: {
            companyId,
            deletedAt: null,
            user: {
              name: {
                contains: trimmedKeyword,
              },
            },
          },
        };
      } else if (searchBy === 'carNumber') {
        where = {
          deletedAt: null,
          contract: {
            companyId,
            deletedAt: null,
            car: {
              carNumber: {
                contains: trimmedKeyword,
              },
            },
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
              user: {
                select: {
                  name: true,
                },
              },
              car: {
                select: {
                  carNumber: true,
                },
              },
              customer: {
                select: {
                  email: true,
                  name: true,
                },
              },
            },
          },
        },
        skip: (page - 1) * pageSize,
        take: Number(pageSize),
        orderBy: {
          createdAt: 'desc',
        },
      }),
      this.prisma.contractDocument.count({ where }),
    ]);

    return { documents, total };
  }

  async findContractById(
    contractId: number,
    companyId: number,
  ): Promise<ContractWithCustomer | null> {
    return this.prisma.contract.findFirst({
      where: {
        id: contractId,
        companyId,
        deletedAt: null,
      },
      include: {
        car: {
          select: {
            carNumber: true,
          },
        },
        customer: {
          select: {
            email: true,
            name: true,
          },
        },
      },
    });
  }

  async countDocumentsByContract(contractId: number): Promise<number> {
    return this.prisma.contractDocument.count({
      where: {
        contractId,
        deletedAt: null,
      },
    });
  }

  async createContractDocuments(
    contractId: number,
    userId: number,
    files: Express.Multer.File[],
  ): Promise<ContractDocument[]> {
    return this.prisma.$transaction(async (tx) => {
      const documents = await Promise.all(
        files.map((file) =>
          tx.contractDocument.create({
            data: {
              contractId,
              documentName: file.originalname,
              fileName: file.filename,
              filePath: file.path,
              fileSize: file.size,
              fileType: file.mimetype,
              uploadedBy: userId,
            },
          }),
        ),
      );

      return documents;
    });
  }

  async findDocumentById(documentId: number, companyId: number): Promise<ContractDocument | null> {
    return this.prisma.contractDocument.findFirst({
      where: {
        id: documentId,
        deletedAt: null,
        contract: {
          companyId,
          deletedAt: null,
        },
      },
    });
  }

  async findDocumentsByIds(documentIds: number[], companyId: number): Promise<ContractDocument[]> {
    return this.prisma.contractDocument.findMany({
      where: {
        id: {
          in: documentIds,
        },
        deletedAt: null,
        contract: {
          companyId,
          deletedAt: null,
        },
      },
    });
  }

  async deleteDocuments(documentIds: number[]): Promise<void> {
    await this.prisma.contractDocument.updateMany({
      where: {
        id: {
          in: documentIds,
        },
      },
      data: {
        deletedAt: new Date(),
      },
    });
  }
  // ✨ 새로운 메서드들: 계약 API 통합용

  /**
   * 계약서들을 특정 계약에 연결
   */
  async attachDocumentsToContract(contractId: number, documentIds: number[]): Promise<void> {
    await this.prisma.contractDocument.updateMany({
      where: {
        id: {
          in: documentIds,
        },
      },
      data: {
        contractId,
      },
    });
  }

  /**
   * 계약서 파일명 업데이트
   */
  async updateDocumentFileName(documentId: number, fileName: string): Promise<void> {
    await this.prisma.contractDocument.update({
      where: {
        id: documentId,
      },
      data: {
        fileName,
      },
    });
  }

  /**
   * 특정 계약에 속한 계약서들 조회
   */
  async findDocumentsByContractId(
    contractId: number,
    companyId: number,
  ): Promise<ContractDocument[]> {
    return this.prisma.contractDocument.findMany({
      where: {
        contractId,
        deletedAt: null,
        contract: {
          companyId,
          deletedAt: null,
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }
}
