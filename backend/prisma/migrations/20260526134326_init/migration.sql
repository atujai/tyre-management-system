-- CreateEnum
CREATE TYPE "Role" AS ENUM ('ADMIN', 'STAFF');

-- CreateEnum
CREATE TYPE "TyreStatus" AS ENUM ('MOUNTED', 'INVENTORY', 'STEPNEY', 'WORN', 'DAMAGED', 'REPAIR', 'SCRAPPED');

-- CreateEnum
CREATE TYPE "StepneyType" AS ENUM ('READY', 'BURST', 'CLAIM', 'PUNCTURE', 'RETREAD_CHECKUP');

-- CreateEnum
CREATE TYPE "LocationType" AS ENUM ('GODOWN', 'RETREADER');

-- CreateEnum
CREATE TYPE "ImageType" AS ENUM ('TYRE', 'DOCUMENT', 'SERIAL_NUMBER');

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "role" "Role" NOT NULL DEFAULT 'STAFF',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "vehicles" (
    "id" TEXT NOT NULL,
    "reg" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "model" TEXT NOT NULL,
    "stepneySlots" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "vehicles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "axles" (
    "id" TEXT NOT NULL,
    "vehicleId" TEXT NOT NULL,
    "tyreCount" INTEGER NOT NULL,
    "steering" BOOLEAN NOT NULL DEFAULT false,
    "drive" BOOLEAN NOT NULL DEFAULT false,
    "line" INTEGER,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "axles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tyres" (
    "id" TEXT NOT NULL,
    "serial" TEXT NOT NULL,
    "brand" TEXT NOT NULL,
    "size" TEXT NOT NULL,
    "pattern" TEXT,
    "purchaseDate" TIMESTAMP(3),
    "initialTread" DOUBLE PRECISION NOT NULL DEFAULT 20,
    "currentTread" DOUBLE PRECISION NOT NULL DEFAULT 20,
    "status" "TyreStatus" NOT NULL DEFAULT 'INVENTORY',
    "cost" DOUBLE PRECISION,
    "remarks" TEXT,
    "withRim" BOOLEAN NOT NULL DEFAULT true,
    "vehicleId" TEXT,
    "axleId" TEXT,
    "position" TEXT,
    "mountingDate" TIMESTAMP(3),
    "stepneyVehicleId" TEXT,
    "stepneyDate" TIMESTAMP(3),
    "stepneyType" "StepneyType",
    "locationId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tyres_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tyre_images" (
    "id" TEXT NOT NULL,
    "tyreId" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "type" "ImageType" NOT NULL DEFAULT 'TYRE',
    "caption" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "tyre_images_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "locations" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" "LocationType" NOT NULL,
    "address" TEXT,
    "contact" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "locations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "history" (
    "id" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "action" TEXT NOT NULL,
    "details" TEXT,
    "tyreId" TEXT NOT NULL,
    "vehicleId" TEXT,
    "axleIndex" INTEGER,
    "position" TEXT,
    "userId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "history_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "vehicles_reg_key" ON "vehicles"("reg");

-- CreateIndex
CREATE UNIQUE INDEX "tyres_serial_key" ON "tyres"("serial");

-- AddForeignKey
ALTER TABLE "axles" ADD CONSTRAINT "axles_vehicleId_fkey" FOREIGN KEY ("vehicleId") REFERENCES "vehicles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tyres" ADD CONSTRAINT "tyres_vehicleId_fkey" FOREIGN KEY ("vehicleId") REFERENCES "vehicles"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tyres" ADD CONSTRAINT "tyres_axleId_fkey" FOREIGN KEY ("axleId") REFERENCES "axles"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tyres" ADD CONSTRAINT "tyres_locationId_fkey" FOREIGN KEY ("locationId") REFERENCES "locations"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tyres" ADD CONSTRAINT "tyres_stepneyVehicleId_fkey" FOREIGN KEY ("stepneyVehicleId") REFERENCES "vehicles"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tyre_images" ADD CONSTRAINT "tyre_images_tyreId_fkey" FOREIGN KEY ("tyreId") REFERENCES "tyres"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "history" ADD CONSTRAINT "history_tyreId_fkey" FOREIGN KEY ("tyreId") REFERENCES "tyres"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "history" ADD CONSTRAINT "history_vehicleId_fkey" FOREIGN KEY ("vehicleId") REFERENCES "vehicles"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "history" ADD CONSTRAINT "history_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
