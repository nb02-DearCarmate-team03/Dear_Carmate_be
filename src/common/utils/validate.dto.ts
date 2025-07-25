import { validate } from 'class-validator';
import { plainToInstance } from 'class-transformer';
import { Request, Response, NextFunction } from 'express';

/**
 * DTO 클래스 타입 받아 타입 유효성 검사
 */
function validateDto<T extends object>(DtoClass: new () => T) {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const dto = plainToInstance(DtoClass, req.body);
    const errors = await validate(dto);

    if (errors.length > 0) {
      const messages = errors.map((err) => Object.values(err.constraints || {})).flat();

      res.status(400).json({
        message: '유효성 검사 실패',
        errors: messages,
      });
      return;
    }

    next();
  };
}

export default validateDto;
