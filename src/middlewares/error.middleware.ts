import { Request, Response } from 'express';

interface CustomError extends Error {
  status?: number;
}

export default function errorHandler(err: CustomError, req: Request, res: Response): void {
  const statusCode = err.status || 500;
  const message = err.message || '서버 내부 오류';

  if (process.env.NODE_ENV === 'development') {
    console.error(`[ERROR] ${req.method} ${req.originalUrl}`);
    console.error(`[STATUS] ${statusCode}`);
    console.error(`[MESSAGE] ${message}`);
    console.error(`[STACK] ${err.stack}`);
  } else {
    console.error(`[ERROR] ${message}`);
  }

  res.status(statusCode).json({
    success: false,
    message,
  });
}
