import { Request, Response } from 'express';

interface CustomError extends Error {
  status?: number;
}

export default function errorHandler(err: CustomError, req: Request, res: Response): void {
  const statusCode = err.status || 500;
  const message = err.message || '서버 내부 오류';

  // 에러 로깅
  // eslint-disable-next-line no-console
  console.error(`[ERROR] ${req.method} ${req.originalUrl}`);
  // eslint-disable-next-line no-console
  console.error(`[STATUS] ${statusCode}`);
  // eslint-disable-next-line no-console
  console.error(`[MESSAGE] ${message}`);

  res.status(statusCode).json({
    success: false,
    message,
  });
}
