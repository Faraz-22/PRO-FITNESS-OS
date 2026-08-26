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
    
    const plan = await prisma.membershipPlan.findUnique({ where: { id: "cmt1ks5e20000nkf16ucem0w0" } });
    console.log("Plan price type:", typeof plan.price, plan.price);
    
    // Simulate what happens in the server action
    const invoice = await prisma.invoice.create({
      data: {
        invoiceNumber: invNum,
        memberId: "cmt1ow53e000hkof1g470e61y",
        branchId: plan.branchId,
        membershipId: "cmt2qjyqt000b3of1era38b8y",
        status: 'ISSUED',
        currency: 'INR',
        subtotal: plan.price,
        discountAmount: 0,
        totalAmount: Number(plan.price), // Simulating finalTotal
        amountPaid: 0,
        amountDue: Number(plan.price),
        issueDate: new Date(),
        dueDate: new Date(),
      }
    });
    console.log("Invoice created successfully!", invoice.id);
  } catch (err) {
    console.error("Prisma error:", err.message);
  } finally {
    await prisma.$disconnect();
    await pool.end();
  }
}

main();
