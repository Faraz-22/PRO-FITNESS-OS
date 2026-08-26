const { PrismaClient } = require('@prisma/client');
const { Pool } = require('pg');
const { PrismaPg } = require('@prisma/adapter-pg');
const dotenv = require('dotenv');
dotenv.config();

const connectionString = process.env.DATABASE_URL;
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  const inactiveMembers = await prisma.memberProfile.findMany({
    where: {
      status: 'INACTIVE',
      phone: { not: { startsWith: 'del_' } }
    },
    include: { user: true }
  });

  console.log(`Found ${inactiveMembers.length} inactive members to anonymize.`);

  let count = 0;
  for (const member of inactiveMembers) {
    const timestamp = Date.now() + count;
    await prisma.$transaction([
      prisma.user.update({
        where: { id: member.userId },
        data: { email: `deleted_${timestamp}_${member.userId}@profitness.local` }
      }),
      prisma.memberProfile.update({
        where: { id: member.id },
        data: { phone: `del_${timestamp}_${member.phone}` }
      })
    ]);
    count++;
  }

  console.log(`Successfully anonymized ${count} members.`);
}

main().finally(() => {
  prisma.$disconnect();
  pool.end();
});
