import prisma from '../src/lib/db/prisma';

async function main() {
  const allMembers = await prisma.memberProfile.findMany({
    select: { id: true, firstName: true, branchId: true, archivedAt: true }
  });
  console.log("All Member Profiles:", allMembers);

  const activeMemberships = await prisma.membership.findMany({
    where: { status: 'ACTIVE' },
    select: { id: true, memberId: true, status: true }
  });
  console.log("All Active Memberships:", activeMemberships);
}

main().catch(console.error).finally(() => process.exit(0));
