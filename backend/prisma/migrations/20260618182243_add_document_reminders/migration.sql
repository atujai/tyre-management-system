-- CreateEnum
CREATE TYPE "ReminderType" AS ENUM ('EXPIRY_30_DAYS', 'EXPIRY_15_DAYS', 'EXPIRY_7_DAYS', 'EXPIRY_1_DAY', 'EXPIRED', 'RENEWAL_DUE');

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "DocumentStatus" ADD VALUE 'RENEWAL_PENDING';
ALTER TYPE "DocumentStatus" ADD VALUE 'ARCHIVED';

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "DocumentType" ADD VALUE 'LICENSE';
ALTER TYPE "DocumentType" ADD VALUE 'TAX';

-- AlterTable
ALTER TABLE "users" ALTER COLUMN "permissions" SET DEFAULT '{"tyres": true, "users": false, "history": true, "stepney": true, "vehicles": true, "allotment": true, "dashboard": true, "locations": true, "documents": true}';

-- CreateTable
CREATE TABLE "document_reminders" (
    "id" TEXT NOT NULL,
    "documentId" TEXT NOT NULL,
    "type" "ReminderType" NOT NULL,
    "daysBefore" INTEGER NOT NULL,
    "sentAt" TIMESTAMP(3),
    "message" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "document_reminders_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "document_reminders_documentId_idx" ON "document_reminders"("documentId");

-- CreateIndex
CREATE INDEX "document_reminders_sentAt_idx" ON "document_reminders"("sentAt");

-- AddForeignKey
ALTER TABLE "document_reminders" ADD CONSTRAINT "document_reminders_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES "vehicle_documents"("id") ON DELETE CASCADE ON UPDATE CASCADE;
