import prisma from '@/lib/db/prisma';
import { env } from '@/lib/config/env';

export class SystemHealthService {
  /**
   * Deep readiness check verifying DB connection and configurations.
   */
  async checkReadiness() {
    try {
      // 1. Check configuration
      if (!env.DATABASE_URL) {
        return { status: 'unready', reason: 'Configuration missing' };
      }

      // 2. Check Database connection by running a simple raw query
      await prisma.$queryRaw`SELECT 1`;
      
      return { status: 'ready' };
    } catch (error: any) {
      return { 
        status: 'unready', 
        reason: 'Database connection failed',
        // In dev, expose more details safely
        ...(env.NODE_ENV !== 'production' ? { details: error.message } : {})
      };
    }
  }

  /**
   * Lightweight liveness check
   */
  checkLiveness() {
    return { status: 'alive', timestamp: new Date().toISOString() };
  }
}

export const systemHealthService = new SystemHealthService();
