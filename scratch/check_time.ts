import prisma from '../src/lib/db/prisma'

async function main() {
  const records = await prisma.attendanceRecord.findMany({
    orderBy: { checkInTime: 'desc' },
    take: 5,
    include: { member: true }
  })
  
  for (const r of records) {
    console.log(`Member: ${r.member.firstName}`)
    console.log(`  Raw checkInTime (UTC): ${r.checkInTime.toISOString()}`)
    console.log(`  Locale IST: ${r.checkInTime.toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}`)
  }
}

main().catch(console.error).finally(() => prisma.$disconnect())
