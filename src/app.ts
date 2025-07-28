import express from 'express';
import errorHandler from './middlewares/error.middleware'; // default import 사용
import indexRouter from './index.routes'; // 라우터 추가

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/', indexRouter); // 라우터 연결

// 에러 핸들링 미들웨어는 모든 라우트 뒤에 위치
app.use(errorHandler);

export default app;
