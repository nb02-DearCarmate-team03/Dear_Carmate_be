import express from 'express';
import errorHandler from './middlewares/error.middleware';
import indexRouter from './index.routes';

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(errorHandler);

app.use('/', indexRouter);

export default app;
