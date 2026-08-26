import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';

const connectionString = process.env.DATABASE_URL;
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  const email = process.env.ADMIN_EMAIL;
  const password = process.env.ADMIN_PASSWORD;
  
  if (!email || !password) {
    console.log('No ADMIN_EMAIL or ADMIN_PASSWORD in .env');
    process.exit(1);
  }
  
  console.log(`Checking user: ${email}`);
  const user = await prisma.user.findUnique({ where: { email } });
  
  if (!user) {
    console.log('User not found in DB!');
  } else {
    console.log(`Found user: ${user.email} (Role: ${user.role})`);
    
    if (user.hashedPassword) {
      const isValid = await bcrypt.compare(password, user.hashedPassword);
      console.log(`Password is valid? ${isValid}`);
    } else {
      console.log('User has no hashed password!');
    }
  }
  
  await prisma.$disconnect();
}

main().catch(console.error);
