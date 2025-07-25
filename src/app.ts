import express from 'express';

import indexRouter from './index.routes';

const app = express();

app.use('/', indexRouter);

export default app;
