const { PrismaClient } = require('@prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');
const { Pool } = require('pg');

async function main() {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/profitness?schema=public' });
  const adapter = new PrismaPg(pool);
  const prisma = new PrismaClient({ adapter });

  try {
    const invCount = await prisma.invoice.count();
    const invNum = `TEST-INV-${invCount + 1}`;
    
    // Simulate what happens in the server action if finalAmount is NaN
    const invoice = await prisma.invoice.create({
      data: {
        invoiceNumber: invNum,
        memberId: "cm02mrp6u000q12cstryv834q", // We don't have the exact ID, but let's just see if Decimal validation fails before foreign key check
        branchId: "cm02mrntc000112cszzg31cve", 
        membershipId: "some-id",
        status: 'ISSUED',
        currency: 'INR',
        subtotal: NaN, // Is this allowed?
        discountAmount: 0,
        totalAmount: NaN,
        amountPaid: 0,
        amountDue: NaN,
        issueDate: new Date(),
        dueDate: new Date(),
      }
    });
    console.log("Success");
  } catch (err) {
    console.error("Prisma error:", err.message);
  } finally {
    await prisma.$disconnect();
    await pool.end();
  }
}

main();
