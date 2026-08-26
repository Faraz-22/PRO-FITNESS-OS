const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const qs = await prisma.deviceCommandQueue.findMany({ orderBy: { createdAt: 'desc' }, take: 10 });
  console.log('COMMANDS:', qs);
}
main().catch(console.error).finally(() => prisma.$disconnect());
