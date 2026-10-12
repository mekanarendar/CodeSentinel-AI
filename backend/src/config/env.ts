import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config();

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().default(3000),
  CLIENT_URL: z.string().default('http://localhost:3000'),
  MONGODB_URI: z.string().default(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/codesentinel'),
  JWT_ACCESS_SECRET: z.string().default('codesentinel-dev-access-secret-32-chars-long!'),
  JWT_REFRESH_SECRET: z.string().default('codesentinel-dev-refresh-secret-32-chars-long!'),
  JWT_ACCESS_EXPIRES_IN: z.string().default('15m'),
  JWT_REFRESH_EXPIRES_IN: z.string().default('7d'),
  AI_PROVIDER: z.string().default('gemini'),
  AI_MODEL: z.string().default('gemini-2.5-flash'),
  GEMINI_API_KEY: z.string().optional().default(''),
  MAX_UPLOAD_SIZE_MB: z.coerce.number().default(25),
  MAX_FILES_PER_PROJECT: z.coerce.number().default(200),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.warn('⚠️ Warning: Environment configuration issues detected:', parsed.error.format());
}

export const env = parsed.success ? parsed.data : envSchema.parse({});
