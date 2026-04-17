-- AlterTable
ALTER TABLE "AccountEntry" ADD COLUMN "appointmentId" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "AccountEntry_appointmentId_key" ON "AccountEntry"("appointmentId");

-- AddForeignKey
ALTER TABLE "AccountEntry"
ADD CONSTRAINT "AccountEntry_appointmentId_fkey"
FOREIGN KEY ("appointmentId") REFERENCES "Event"("id")
ON DELETE SET NULL ON UPDATE CASCADE;
