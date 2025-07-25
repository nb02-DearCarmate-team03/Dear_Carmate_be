import { Request, Response } from 'express';

export const errorHandler = (err: unknown, req: Request, res: Response) => {
  let message = '서버 내부 오류';
  let statusCode = 500;

  if (
    typeof err === 'object' &&
    err !== null &&
    'message' in err &&
    typeof err.message === 'string'
  ) {
    message = err.message;
  }

  if (
    typeof err === 'object' &&
    err !== null &&
    'status' in err &&
    typeof err.status === 'number'
  ) {
    statusCode = err.status;
  }

  // eslint-disable-next-line no-console
  console.error(`[ERROR] ${req.method} ${req.originalUrl}`);
  // eslint-disable-next-line no-console
  console.error(`[STATUS] ${statusCode}`);
  // eslint-disable-next-line no-console
  console.error(`[MESSAGE] ${message}`);

  res.status(statusCode).json({ success: false, message });
};

export default errorHandler;
