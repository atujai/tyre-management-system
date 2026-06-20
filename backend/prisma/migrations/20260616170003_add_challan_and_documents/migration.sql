-- CreateEnum
CREATE TYPE "ChallanStatus" AS ENUM ('PENDING', 'PAID', 'DISMISSED', 'CONTESTED', 'OVERDUE', 'PAYMENT_FAILED');

-- CreateEnum
CREATE TYPE "PaymentMethod" AS ENUM ('ONLINE', 'UPI', 'CARD', 'NETBANKING', 'WALLET', 'CASH');

-- CreateEnum
CREATE TYPE "PaymentStatus" AS ENUM ('PENDING', 'SUCCESS', 'FAILED', 'REFUNDED');

-- CreateEnum
CREATE TYPE "ChallanSource" AS ENUM ('PARIVAHAN', 'STATE_RTO', 'MANUAL', 'IMPORT');

-- CreateEnum
CREATE TYPE "DocumentType" AS ENUM ('RC', 'INSURANCE', 'PUC', 'FITNESS', 'PERMIT', 'ROAD_TAX', 'NOC', 'OTHER');

-- CreateEnum
CREATE TYPE "DocumentStatus" AS ENUM ('ACTIVE', 'EXPIRING_SOON', 'EXPIRED', 'UNDER_RENEWAL', 'PENDING');

-- CreateTable
CREATE TABLE "challans" (
    "id" TEXT NOT NULL,
    "vehicleId" TEXT NOT NULL,
    "challanNumber" TEXT NOT NULL,
    "challanDate" TIMESTAMP(3) NOT NULL,
    "offence" TEXT NOT NULL,
    "section" TEXT,
    "fineAmount" DOUBLE PRECISION NOT NULL,
    "penaltyAmount" DOUBLE PRECISION,
    "totalAmount" DOUBLE PRECISION NOT NULL,
    "status" "ChallanStatus" NOT NULL DEFAULT 'PENDING',
    "paymentDate" TIMESTAMP(3),
    "paymentReceipt" TEXT,
    "paymentMethod" "PaymentMethod",
    "paymentGatewayRef" TEXT,
    "location" TEXT,
    "evidenceUrl" TEXT,
    "source" "ChallanSource" NOT NULL DEFAULT 'MANUAL',
    "checkedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "challans_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "challan_payments" (
    "id" TEXT NOT NULL,
    "challanId" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "method" "PaymentMethod" NOT NULL,
    "gatewayRef" TEXT,
    "status" "PaymentStatus" NOT NULL DEFAULT 'PENDING',
    "initiatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),
    "failureReason" TEXT,
    "receiptUrl" TEXT,

    CONSTRAINT "challan_payments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "vehicle_documents" (
    "id" TEXT NOT NULL,
    "vehicleId" TEXT NOT NULL,
    "type" "DocumentType" NOT NULL,
    "number" TEXT,
    "issuer" TEXT,
    "issueDate" TIMESTAMP(3),
    "expiryDate" TIMESTAMP(3),
    "amount" DOUBLE PRECISION,
    "status" "DocumentStatus" NOT NULL DEFAULT 'ACTIVE',
    "fileUrl" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "vehicle_documents_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "challans_challanNumber_key" ON "challans"("challanNumber");

-- AddForeignKey
ALTER TABLE "challans" ADD CONSTRAINT "challans_vehicleId_fkey" FOREIGN KEY ("vehicleId") REFERENCES "vehicles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "challan_payments" ADD CONSTRAINT "challan_payments_challanId_fkey" FOREIGN KEY ("challanId") REFERENCES "challans"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vehicle_documents" ADD CONSTRAINT "vehicle_documents_vehicleId_fkey" FOREIGN KEY ("vehicleId") REFERENCES "vehicles"("id") ON DELETE CASCADE ON UPDATE CASCADE;
