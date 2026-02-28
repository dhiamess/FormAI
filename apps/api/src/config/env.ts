import { z } from 'zod';
import path from 'path';
import dotenv from 'dotenv';
dotenv.config({ path: path.resolve(__dirname, '../../../../.env') });

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().default(4000),
  FRONTEND_URL: z.string().url().default('http://localhost:3000'),
  MONGODB_URI: z.string().default('mongodb://localhost:27017/formai'),
  REDIS_URL: z.string().default('redis://localhost:6379'),
  JWT_SECRET: z.string().min(32),
  JWT_REFRESH_SECRET: z.string().min(32),
  JWT_EXPIRES_IN: z.string().default('15m'),
  JWT_REFRESH_EXPIRES_IN: z.string().default('7d'),
  ANTHROPIC_API_KEY: z.string().startsWith('sk-ant-'),
  AI_MODEL: z.string().default('claude-sonnet-4-5-20250929'),
  AI_MAX_TOKENS: z.coerce.number().default(4096),
  ENCRYPTION_KEY: z.string().min(32),
});

export type Env = z.infer<typeof envSchema>;
export const env: Env = envSchema.parse(process.env);
