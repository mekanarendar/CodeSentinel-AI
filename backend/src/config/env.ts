import dotenv from 'dotenv';
import { randomBytes } from 'node:crypto';
import { z } from 'zod';

dotenv.config();

const isProduction = process.env.NODE_ENV === 'production';

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().int().min(1).max(65535).default(3000),
  CLIENT_URL: z.string().default('http://localhost:3000'),
  MONGODB_URI: z
    .string()
    .trim()
    .min(1)
    .default(isProduction ? '' : 'mongodb://127.0.0.1:27017/codesentinel'),
  JWT_ACCESS_SECRET: z
    .string()
    .trim()
    .min(32)
    .default(isProduction ? '' : randomBytes(32).toString('hex')),
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
  const details = parsed.error.issues
    .map((issue) => `${issue.path.join('.') || 'environment'}: ${issue.message}`)
    .join('; ');
  throw new Error(`Invalid environment configuration: ${details}`);
}

if (isProduction) {
  const issues = [
    !process.env.MONGODB_URI?.trim() && 'MONGODB_URI is required in production',
    (process.env.JWT_ACCESS_SECRET?.length ?? 0) < 32 &&
      'JWT_ACCESS_SECRET must be at least 32 characters in production',
  ].filter((issue): issue is string => Boolean(issue));

  if (issues.length > 0) {
    throw new Error(`Invalid environment configuration: ${issues.join('; ')}`);
  }
}

export const env = parsed.data;
