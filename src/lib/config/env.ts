import { z } from 'zod';

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  DATABASE_URL: z.string().url('DATABASE_URL must be a valid PostgreSQL connection string'),
  NEXTAUTH_SECRET: z.string().min(16, 'NEXTAUTH_SECRET must be at least 16 characters long'),
  NEXTAUTH_URL: z.string().url('NEXTAUTH_URL must be a valid URL').optional(),
  NEXT_PUBLIC_APP_URL: z.string().url('NEXT_PUBLIC_APP_URL must be a valid URL').optional(),
}).refine(data => {
  if (data.NODE_ENV === 'production' && !process.env.VERCEL) {
    return !!data.NEXTAUTH_URL && !!data.NEXT_PUBLIC_APP_URL;
  }
  return true;
}, {
  message: "NEXTAUTH_URL and NEXT_PUBLIC_APP_URL are required in production",
  path: ['NEXTAUTH_URL']
});

const parseEnv = () => {
  // Try to validate the environment
  const isTest = process.env.NODE_ENV === 'test';
  
  const envToParse = {
    ...process.env,
    ...(isTest && {
      DATABASE_URL: process.env.DATABASE_URL || 'postgresql://localhost:5432/test',
      NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET || 'test-secret-at-least-16-chars',
    })
  };

  const parsed = envSchema.safeParse(envToParse);
  
  if (!parsed.success) {
    console.error('❌ Invalid environment variables:');
    parsed.error.issues.forEach(err => {
      console.error(`  - ${err.path.join('.')}: ${err.message}`);
    });
    
    // Fail fast in production or if it's a critical runtime script
    if (process.env.NODE_ENV === 'production') {
      throw new Error('Invalid environment configuration');
    }
    
    // In local development, we still want to throw if core secrets are missing
    throw new Error('Missing or invalid core environment variables. Check .env file.');
  }
  
  return parsed.data;
};

// This ensures validation happens at startup when this file is imported
export const env = parseEnv();
