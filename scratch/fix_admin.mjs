import { PrismaClient } from '@prisma/client';
import pg from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';

const connectionString = process.env.DATABASE_URL;
const pool = new pg.Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  const user = await prisma.user.findFirst({ where: { role: 'SUPER_ADMIN' } });
  if (!user) return console.log('No user found');
  
  let branch = await prisma.branch.findFirst({ where: { code: 'MAIN' } });
  if (!branch) {
    branch = await prisma.branch.create({
      data: { name: 'Main Branch', code: 'MAIN', timezone: 'Asia/Kolkata' }
    });
  }
  
  const existingStaff = await prisma.staffProfile.findUnique({ where: { userId: user.id } });
  if (existingStaff) return console.log('Staff profile already exists');

  await prisma.staffProfile.create({
    data: {
      userId: user.id,
      branchId: branch.id,
      employeeId: 'ADM001',
      firstName: user.name ? user.name.split(' ')[0] : 'Admin',
      lastName: user.name && user.name.includes(' ') ? user.name.split(' ').slice(1).join(' ') : 'User',
      department: 'MANAGEMENT'
    }
  });
  console.log('Staff profile attached successfully!');
}

main().catch(console.error).finally(() => prisma.$disconnect());
