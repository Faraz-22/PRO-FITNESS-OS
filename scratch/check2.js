require('dotenv').config({ path: '.env.local' });
require('dotenv').config({ path: '.env' });
const { PrismaClient } = require('@prisma/client');
const { Pool } = require('pg');
const { PrismaPg } = require('@prisma/adapter-pg');

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  const members = await prisma.memberProfile.findMany({
    select: { id: true, firstName: true, branchId: true, archivedAt: true }
  });
  
  const branches = {};
  for (const m of members) {
    if (m.archivedAt) continue;
    branches[m.branchId] = (branches[m.branchId] || 0) + 1;
  }
  console.log("Unarchived by branch:", branches);

  const active = await prisma.memberProfile.findMany({
    where: {
      archivedAt: null,
      memberships: { some: { status: 'ACTIVE' } }
    },
    select: { id: true, branchId: true }
  });
  
  const activeBranches = {};
  for (const m of active) {
    activeBranches[m.branchId] = (activeBranches[m.branchId] || 0) + 1;
  }
  console.log("Active by branch:", activeBranches);
}

main().catch(console.error).finally(() => process.exit(0));
