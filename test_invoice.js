const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const invoice = await prisma.invoice.findFirst();
  if (invoice) {
    console.log(`FOUND INVOICE ID: ${invoice.id}`);
  } else {
    console.log('NO INVOICES FOUND');
  }
}
main().finally(() => prisma.$disconnect());
