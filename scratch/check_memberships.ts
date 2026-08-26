import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const members = await prisma.memberProfile.findMany({
    include: {
      memberships: true
    }
  });

  const totalMembers = members.filter(m => !m.archivedAt);
  
  console.log(`Total Members: ${members.length}`);
  console.log(`Total Unarchived Members: ${totalMembers.length}`);

  const activeMembersDashboard = await prisma.memberProfile.count({
    where: {
      archivedAt: null,
      memberships: {
        some: {
          status: 'ACTIVE'
        }
      }
    }
  });
  console.log(`Dashboard Active Members Count: ${activeMembersDashboard}`);
  
  const unarchivedMembersQuery = await prisma.memberProfile.count({
    where: {
      archivedAt: null
    }
  });
  console.log(`getTotalMembersCount returns: ${unarchivedMembersQuery}`);

  // let's figure out what's causing the mismatch!
}

main().catch(console.error).finally(() => prisma.$disconnect());
