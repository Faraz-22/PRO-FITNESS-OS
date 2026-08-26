require('dotenv').config({ path: '.env.local' });
require('dotenv').config({ path: '.env' });
const { PrismaClient } = require('@prisma/client');
const { Pool } = require('pg');
const { PrismaPg } = require('@prisma/adapter-pg');

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  const activeMemberships = await prisma.membership.count({
    where: { 
      status: 'ACTIVE',
      member: { archivedAt: null }
    }
  });
  console.log("Active Memberships:", activeMemberships);
  
  const activeMembers = await prisma.memberProfile.count({
    where: {
      archivedAt: null,
      memberships: { some: { status: 'ACTIVE' } }
    }
  });
  console.log("Active Members:", activeMembers);
}

main().catch(console.error).finally(() => process.exit(0));
