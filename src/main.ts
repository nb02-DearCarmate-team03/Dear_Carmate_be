// eslint-disable-next-line import/no-extraneous-dependencies
import 'reflect-metadata';
import dotenv from 'dotenv';
import app from './app';

dotenv.config();

const PORT = process.env.PORT || 3000;
// eslint-disable-next-line @typescript-eslint/no-empty-function
app.listen(PORT, () => {});
