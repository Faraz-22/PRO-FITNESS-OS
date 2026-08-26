import prisma from '@/lib/db/prisma';
import { processDailyFreezeExpirations } from '@/lib/services/membership-freeze.service';

export async function processAllAutoResumes() {
  return await processDailyFreezeExpirations();
}
