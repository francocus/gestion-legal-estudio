-- CreateEnum
CREATE TYPE "AppointmentStatus" AS ENUM ('PENDING', 'CONFIRMED', 'COMPLETED', 'CANCELLED', 'NO_SHOW');

-- CreateEnum
CREATE TYPE "AppointmentMode" AS ENUM ('IN_PERSON', 'PHONE', 'VIDEO');

-- AlterEnum
ALTER TYPE "EventType" ADD VALUE 'APPOINTMENT';

-- AlterTable
ALTER TABLE "Event"
ADD COLUMN "appointmentMode" "AppointmentMode",
ADD COLUMN "appointmentStatus" "AppointmentStatus",
ADD COLUMN "clientId" TEXT,
ADD COLUMN "depositAmount" DOUBLE PRECISION,
ADD COLUMN "depositPaid" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN "durationMinutes" INTEGER;

-- AddForeignKey
ALTER TABLE "Event" ADD CONSTRAINT "Event_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE SET NULL ON UPDATE CASCADE;
