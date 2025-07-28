import { Request, Response } from 'express';

interface CustomError extends Error {
  status?: number;
}

// eslint-disable-next-line prettier/prettier
export default function errorHandler(
  err: CustomError,
  req: Request,
  res: Response
): void {
  const statusCode = err.status || 500;
  const message = err.message || '서버 내부 오류';

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

  res.status(statusCode).json({ message: '서버에서 문제가 발생했습니다.' });
}
