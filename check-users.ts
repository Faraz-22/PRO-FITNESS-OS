import prisma from './src/lib/db/prisma';
import bcrypt from 'bcryptjs';

async function main() {
  console.log('Checking database users...');
  const users = await prisma.user.findMany({
    select: { id: true, email: true, role: true, hashedPassword: true }
  });

  if (users.length === 0) {
    console.log('❌ NO USERS FOUND IN DATABASE! You need to seed the database.');
    return;
  }

  for (const user of users) {
    const isValid = await bcrypt.compare('password123', user.hashedPassword || '');
    console.log(`User: ${user.email} | Role: ${user.role} | Valid password123?: ${isValid ? 'YES ✅' : 'NO ❌'}`);
  }
}

main()
  .catch(e => console.error(e))
  .finally(() => prisma.$disconnect());
