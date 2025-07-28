import express from 'express';
import cookieParser from 'cookie-parser';
import morgan from 'morgan';
import passport from './auth/passport';

import indexRouter from './index.routes';

const app = express();

app.use(morgan('dev'));

app.use(express.json());
app.use(cookieParser());

app.use(passport.initialize());

app.use('/', indexRouter);

export default app;
