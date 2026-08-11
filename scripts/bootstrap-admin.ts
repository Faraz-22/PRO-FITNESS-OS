import 'dotenv/config';
import { PrismaClient, Role } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';

const connectionString = process.env.DATABASE_URL;
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function bootstrapAdmin() {
  console.log('Bootstrapping admin account...');

  const email = process.env.ADMIN_EMAIL;
  const password = process.env.ADMIN_PASSWORD;

  if (!email || !password) {
    console.error('Error: ADMIN_EMAIL and ADMIN_PASSWORD must be provided in .env');
    process.exit(1);
  }

  try {
    const existingAdmin = await prisma.user.findFirst({
      where: { role: Role.SUPER_ADMIN },
    });

    if (existingAdmin) {
      console.log('A SUPER_ADMIN already exists. Bootstrapping aborted.');
      process.exit(0);
    }

    const salt = await bcrypt.genSalt(12);
    const hashedPassword = await bcrypt.hash(password, salt);

    const admin = await prisma.user.create({
      data: {
        name: 'Super Admin',
        email,
        hashedPassword,
        role: Role.SUPER_ADMIN,
        emailVerified: new Date(),
      },
    });

    console.log(`Successfully created SUPER_ADMIN with email: ${admin.email}`);
  } catch (error) {
    console.error('Error bootstrapping admin:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

bootstrapAdmin();
