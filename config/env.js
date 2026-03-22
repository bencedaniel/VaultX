import dotenv from 'dotenv';
import path from 'path';

// Load .env once from project root so all modules can safely import env constants.
dotenv.config({ path: path.join(process.cwd(), '.env'), quiet: true });

export const MONGODB_URI = process.env.MONGODB_URI;
export const PORT = process.env.PORT;
export const SECRET_ACCESS_TOKEN = process.env.SECRET_ACCESS_TOKEN;
export const SECURE_MODE = process.env.SECURE_MODE;
export const SECRET_API_KEY = process.env.SECRET_API_KEY;
export const TESTDB = process.env.TESTDB;
export const TRUST_PROXY = process.env.TRUST_PROXY;
export const DOMAIN = process.env.DOMAIN;
export const TIMEOUT = process.env.TIMEOUT;
