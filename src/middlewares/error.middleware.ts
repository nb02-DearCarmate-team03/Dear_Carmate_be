/* eslint-disable */
import { Request, Response, NextFunction } from 'express';

interface CustomError extends Error {
  status?: number;
}

// 커스텀 에러 클래스
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

// 통합 에러 핸들러
export default function errorHandler(
  err: CustomError,
  req: Request,
  res: Response,
  next: NextFunction,
): void {
  const statusCode = err.status || (err instanceof AppError ? (err as AppError).statusCode : 500);
  const message = err.message || '서버 내부 오류';

  // Prisma 에러 처리
  if (err.name === 'PrismaClientKnownRequestError') {
    const prismaError = err as any;

    if (prismaError.code === 'P2002') {
      res.status(409).json({ message: '중복된 데이터가 존재합니다.' });
      return;
    }

    if (prismaError.code === 'P2025') {
      res.status(404).json({ message: '요청한 리소스를 찾을 수 없습니다.' });
      return;
    }
  }

  // 개발 환경일 때 상세 로그
  if (process.env.NODE_ENV === 'development') {
    // eslint-disable-next-line no-console
    console.error(`[ERROR] ${req.method} ${req.originalUrl}`);
    // eslint-disable-next-line no-console
    console.error(`[STATUS] ${statusCode}`);
    // eslint-disable-next-line no-console
    console.error(`[MESSAGE] ${message}`);
    // eslint-disable-next-line no-console
    console.error(`[STACK] ${err.stack}`);
  } else {
    // eslint-disable-next-line no-console
    console.error(`[ERROR] ${message}`);
  }

  // 응답 헤더가 이미 전송되었다면 next로
  if (res.headersSent) {
    return next(err);
  }

  // 최종 응답
  res.status(statusCode).json({
    message: message || '서버 오류가 발생했습니다.',
    ...(process.env.NODE_ENV === 'development' && { error: err.message, stack: err.stack }),
  });
}
