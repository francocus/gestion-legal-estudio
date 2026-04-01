-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "EventType" ADD VALUE 'PERSONAL';
ALTER TYPE "EventType" ADD VALUE 'MEDICAL';
ALTER TYPE "EventType" ADD VALUE 'SOCIAL';
ALTER TYPE "EventType" ADD VALUE 'OTHER';

-- AlterTable
ALTER TABLE "Event" ALTER COLUMN "caseId" DROP NOT NULL;
