ALTER TABLE "MemberProfile" ADD COLUMN "rfidCardNumber" TEXT;
ALTER TABLE "MemberProfile" ADD CONSTRAINT "MemberProfile_rfidCardNumber_key" UNIQUE ("rfidCardNumber");
