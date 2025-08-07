import { validate } from 'class-validator';
import { plainToInstance } from 'class-transformer';
import { Request, Response, NextFunction } from 'express';

/**
 * DTO 클래스 타입 받아 타입 유효성 검사
 * Transform 데코레이터 지원 포함
 */
function validateDto<T extends object>(DtoClass: new () => T) {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    // plainToInstance로 변환할 때 Transform 데코레이터가 실행되도록 옵션 추가
    const dto = plainToInstance(DtoClass, req.body, {
      enableImplicitConversion: true, // 암시적 타입 변환 활성화
      excludeExtraneousValues: false, // 추가 속성 제거하지 않음
    });

    // 변환된 dto를 req.body에 다시 할당 (중요!)
    // 이렇게 해야 컨트롤러에서 변환된 값을 받을 수 있음
    req.body = dto;

    const errors = await validate(dto, {
      whitelist: true, // DTO에 정의되지 않은 속성 제거
      forbidNonWhitelisted: false, // 정의되지 않은 속성이 있어도 에러 발생하지 않음
      skipMissingProperties: false, // 필수 속성 검사
    });

    if (errors.length > 0) {
      const messages = errors.map((err) => {
        const constraints = err.constraints || {};
        return {
          property: err.property,
          errors: Object.values(constraints),
        };
      });

      res.status(400).json({
        message: '유효성 검사 실패',
        details: messages,
      });
      return;
    }

    next();
  };
}

export default validateDto;
