const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const members = await prisma.memberProfile.findMany({
    where: { firstName: { contains: 'aditi', mode: 'insensitive' } },
    include: { memberships: true }
  });
  console.log(JSON.stringify(members, null, 2));
}

main().catch(console.error).finally(() => prisma.$disconnect());
