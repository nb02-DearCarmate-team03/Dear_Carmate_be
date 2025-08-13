import { Options } from 'swagger-jsdoc';

const swaggerOptions: Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Dear-Carmate 중고차 계약 관리 서비스',
      version: '1.0.0',
      description: 'Swagger로 만든 Dear-Carmate API 문서입니다.',
    },
    servers: [
      {
        url:
          process.env.NODE_ENV === 'production'
            ? process.env.RENDER_EXTERNAL_URL || 'https://your-app.onrender.com'
            : `http://localhost:${process.env.PORT || 4000}`,
      },
    ],
  },
  apis: [
    './src/**/*.ts',
    './dist/**/*.js', // src 폴더와 그 하위 모든 폴더에 있는 .ts 파일을 스캔합니다.
  ],
};

export default swaggerOptions;
