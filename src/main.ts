// eslint-disable-next-line import/no-extraneous-dependencies
import 'reflect-metadata';
import dotenv from 'dotenv';
import app from './app';

dotenv.config();

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {});
