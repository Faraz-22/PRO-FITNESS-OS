import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const members = await prisma.memberProfile.findMany({
    include: {
      memberships: true
    }
  });
  
  console.log("Total members:", members.length);
  
  let activeCount = 0;
  const now = new Date();
  
  for (const m of members) {
    const hasActive = m.memberships.some(ms => 
      ms.status === 'ACTIVE' && 
      ms.startDate <= now && 
      ms.endDate >= now
    );
    if (hasActive) {
      activeCount++;
    } else {
      console.log(`Member ${m.memberNumber} has NO currently active membership.`);
      console.log(m.memberships.map(ms => ({ status: ms.status, start: ms.startDate, end: ms.endDate })));
    }
  }
  
  console.log("Total members with active memberships:", activeCount);
}

main().finally(() => prisma.$disconnect());
