-- CreateEnum
CREATE TYPE "ConnectionMode" AS ENUM ('MOCK', 'LOCAL_NETWORK', 'PUSH', 'PULL', 'UNKNOWN');

-- CreateEnum
CREATE TYPE "SyncStatus" AS ENUM ('PENDING', 'SYNCED', 'FAILED', 'RETRYING');

-- CreateEnum
CREATE TYPE "ProcessingStatus" AS ENUM ('UNPROCESSED', 'PROCESSED', 'ERROR');

-- CreateEnum
CREATE TYPE "AttendanceMethod" AS ENUM ('BIOMETRIC', 'QR', 'RFID', 'MANUAL', 'OTHER');

-- CreateEnum
CREATE TYPE "AccessDecision" AS ENUM ('ALLOWED', 'DENIED');

-- CreateTable
CREATE TABLE "AccessDevice" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "deviceType" TEXT NOT NULL,
    "manufacturer" TEXT NOT NULL,
    "model" TEXT NOT NULL,
    "serialNumber" TEXT,
    "branchId" TEXT NOT NULL,
    "ipAddress" TEXT,
    "port" INTEGER,
    "connectionMode" "ConnectionMode" NOT NULL DEFAULT 'UNKNOWN',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "lastSeenAt" TIMESTAMP(3),
    "lastSyncAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AccessDevice_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DeviceMemberIdentity" (
    "id" TEXT NOT NULL,
    "memberId" TEXT NOT NULL,
    "deviceId" TEXT NOT NULL,
    "externalUserId" TEXT NOT NULL,
    "desiredEnabled" BOOLEAN NOT NULL DEFAULT false,
    "actualEnabled" BOOLEAN NOT NULL DEFAULT false,
    "syncStatus" "SyncStatus" NOT NULL DEFAULT 'PENDING',
    "lastSyncAttemptAt" TIMESTAMP(3),
    "lastSyncedAt" TIMESTAMP(3),
    "lastSyncError" TEXT,
    "enrolledAt" TIMESTAMP(3),
    "disabledAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DeviceMemberIdentity_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DeviceAccessEvent" (
    "id" TEXT NOT NULL,
    "deviceId" TEXT NOT NULL,
    "externalEventId" TEXT NOT NULL,
    "externalUserId" TEXT NOT NULL,
    "eventTimestamp" TIMESTAMP(3) NOT NULL,
    "serverReceiptTimestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "eventType" TEXT,
    "rawPayload" JSONB NOT NULL,
    "processingStatus" "ProcessingStatus" NOT NULL DEFAULT 'UNPROCESSED',
    "processedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DeviceAccessEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AttendanceRecord" (
    "id" TEXT NOT NULL,
    "memberId" TEXT NOT NULL,
    "branchId" TEXT NOT NULL,
    "deviceId" TEXT,
    "checkInTime" TIMESTAMP(3) NOT NULL,
    "checkOutTime" TIMESTAMP(3),
    "method" "AttendanceMethod" NOT NULL DEFAULT 'BIOMETRIC',
    "sourceEventId" TEXT,
    "accessDecision" "AccessDecision" NOT NULL,
    "denialReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AttendanceRecord_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "AccessDevice_branchId_idx" ON "AccessDevice"("branchId");

-- CreateIndex
CREATE INDEX "DeviceMemberIdentity_memberId_idx" ON "DeviceMemberIdentity"("memberId");

-- CreateIndex
CREATE INDEX "DeviceMemberIdentity_deviceId_idx" ON "DeviceMemberIdentity"("deviceId");

-- CreateIndex
CREATE UNIQUE INDEX "DeviceMemberIdentity_deviceId_externalUserId_key" ON "DeviceMemberIdentity"("deviceId", "externalUserId");

-- CreateIndex
CREATE UNIQUE INDEX "DeviceMemberIdentity_deviceId_memberId_key" ON "DeviceMemberIdentity"("deviceId", "memberId");

-- CreateIndex
CREATE INDEX "DeviceAccessEvent_deviceId_processingStatus_idx" ON "DeviceAccessEvent"("deviceId", "processingStatus");

-- CreateIndex
CREATE UNIQUE INDEX "DeviceAccessEvent_deviceId_externalEventId_key" ON "DeviceAccessEvent"("deviceId", "externalEventId");

-- CreateIndex
CREATE INDEX "AttendanceRecord_memberId_idx" ON "AttendanceRecord"("memberId");

-- CreateIndex
CREATE INDEX "AttendanceRecord_branchId_checkInTime_idx" ON "AttendanceRecord"("branchId", "checkInTime");

-- CreateIndex
CREATE INDEX "AttendanceRecord_deviceId_idx" ON "AttendanceRecord"("deviceId");

-- AddForeignKey
ALTER TABLE "AccessDevice" ADD CONSTRAINT "AccessDevice_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "Branch"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DeviceMemberIdentity" ADD CONSTRAINT "DeviceMemberIdentity_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "MemberProfile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DeviceMemberIdentity" ADD CONSTRAINT "DeviceMemberIdentity_deviceId_fkey" FOREIGN KEY ("deviceId") REFERENCES "AccessDevice"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DeviceAccessEvent" ADD CONSTRAINT "DeviceAccessEvent_deviceId_fkey" FOREIGN KEY ("deviceId") REFERENCES "AccessDevice"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AttendanceRecord" ADD CONSTRAINT "AttendanceRecord_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "MemberProfile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AttendanceRecord" ADD CONSTRAINT "AttendanceRecord_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "Branch"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AttendanceRecord" ADD CONSTRAINT "AttendanceRecord_deviceId_fkey" FOREIGN KEY ("deviceId") REFERENCES "AccessDevice"("id") ON DELETE SET NULL ON UPDATE CASCADE;
