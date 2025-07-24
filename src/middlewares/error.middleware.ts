import { Request, Response, NextFunction } from 'express';

export const errorHandler = (err: any, req: Request, res: Response, _next: NextFunction) => {
  const statusCode = err.status || 500;
  const message = err.message || '서버 내부 오류';

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
};

export default errorHandler;
