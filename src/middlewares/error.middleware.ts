/* eslint-disable */
import { Request, Response, NextFunction } from 'express';

// 커스텀 에러 클래스들 (선택적으로 사용)
export class AppError extends Error {
  constructor(
    public message: string,
    public statusCode: number,
  ) {
    super(message);
    this.name = this.constructor.name;
    Error.captureStackTrace(this, this.constructor);
  }
}

export class NotFoundError extends AppError {
  constructor(message: string) {
    super(message, 404);
  }
}

export class BadRequestError extends AppError {
  constructor(message: string) {
    super(message, 400);
  }
}

export class ConflictError extends AppError {
  constructor(message: string) {
    super(message, 409);
  }
}

export class UnauthorizedError extends AppError {
  constructor(message: string) {
    super(message, 401);
  }
}

// 처리되지 않은 에러들을 위한 기본 에러 핸들러
export const errorHandler = (err: Error, req: Request, res: Response, next: NextFunction): void => {
  console.error('Unhandled Error:', err);

  // 이미 응답이 시작된 경우
  if (res.headersSent) {
    return next(err);
  }

  // Prisma 에러 처리
  if (err.name === 'PrismaClientKnownRequestError') {
    const prismaError = err as any;

    if (prismaError.code === 'P2002') {
      res.status(409).json({
        message: '중복된 데이터가 존재합니다.',
      });
      return;
    }

    if (prismaError.code === 'P2025') {
      res.status(404).json({
        message: '요청한 리소스를 찾을 수 없습니다.',
      });
      return;
    }
  }

  // 기본 에러 처리
  const isDevelopment = process.env.NODE_ENV === 'development';

  res.status(500).json({
    message: '서버 오류가 발생했습니다.',
    ...(isDevelopment && { error: err.message, stack: err.stack }),
  });
};
