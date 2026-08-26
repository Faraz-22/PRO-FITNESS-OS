const { Pool } = require('pg');

async function main() {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/profitness?schema=public' });
  
  try {
    await pool.query(`DELETE FROM "Invoice" WHERE "invoiceNumber" LIKE 'TEST-INV-%'`);

    const result = await pool.query(`
      DELETE FROM "Membership" 
      WHERE "status" = 'PENDING_PAYMENT' 
      AND "id" NOT IN (SELECT "membershipId" FROM "Invoice" WHERE "membershipId" IS NOT NULL);
    `);
    console.log(`Cleaned up ${result.rowCount} orphaned PENDING_PAYMENT memberships across the whole database!`);
  } catch (err) {
    console.error(err);
  } finally {
    await pool.end();
  }
}

main();
