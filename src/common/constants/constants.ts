import dotenv from 'dotenv';

dotenv.config();

export const PORT = process.env.PORT || 3000;

export const JWT_ACCESS_TOKEN_SECRET = process.env.JWT_ACCESS_TOKEN_SECRET || 'access_secret';
export const JWT_REFRESH_TOKEN_SECRET = process.env.JWT_REFRESH_TOKEN_SECRET || 'refresh_secret';

export const ACCESS_TOKEN_COOKIE_NAME = 'access-token';
export const REFRESH_TOKEN_COOKIE_NAME = 'refresh-token';

export const NODE_ENV = process.env.NODE_ENV || 'development';
