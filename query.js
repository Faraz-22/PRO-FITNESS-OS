const { Pool } = require('pg');

async function main() {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/profitness?schema=public' });
  
  try {
    const invoices = await pool.query(`SELECT "id", "invoiceNumber", "membershipId", "status", "totalAmount" FROM "Invoice" ORDER BY "createdAt" DESC LIMIT 5`);
    console.log("Recent Invoices:", invoices.rows);
    
    const memberships = await pool.query(`SELECT "id", "memberId", "planId", "status" FROM "Membership" WHERE "status" = 'PENDING_PAYMENT' ORDER BY "createdAt" DESC LIMIT 5`);
    console.log("Pending Memberships:", memberships.rows);
  } catch (err) {
    console.error(err);
  } finally {
    await pool.end();
  }
}

main();
