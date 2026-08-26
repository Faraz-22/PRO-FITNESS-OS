-- DropIndex
DROP INDEX IF EXISTS "Membership_memberId_branchId_active_key";

-- AlterTable
ALTER TABLE "Membership" ADD COLUMN     "previousMembershipId" TEXT;

-- AddForeignKey
ALTER TABLE "Membership" ADD CONSTRAINT "Membership_previousMembershipId_fkey" FOREIGN KEY ("previousMembershipId") REFERENCES "Membership"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
