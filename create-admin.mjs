import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import pg from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';

const connectionString = process.env.DATABASE_URL;
const pool = new pg.Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  const email = process.argv[2];
  const password = process.argv[3];
  const name = process.argv[4] || 'Admin';

  if (!email || !password) {
    console.error('Please provide an email and password!');
    console.error('Usage: node create-admin.mjs <email> <password> [name]');
    process.exit(1);
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  try {
    const user = await prisma.user.create({
      data: {
        email,
        name,
        hashedPassword,
        role: 'SUPER_ADMIN',
      },
    });

    // Create a staff profile for the super admin
    await prisma.staffProfile.create({
      data: {
        userId: user.id,
        role: 'SUPER_ADMIN',
      },
    });

    console.log(`✅ Successfully created SUPER ADMIN with email: ${email}`);
  } catch (error) {
    console.error('Failed to create user:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

main();
