CREATE TYPE "ObligationCategory" AS ENUM ('TAX', 'FEE', 'CONTRIBUTION', 'SERVICE', 'RENT', 'FILING', 'OTHER');

CREATE TYPE "ObligationStatus" AS ENUM ('PENDING', 'FILED', 'PAID', 'CANCELLED');

CREATE TABLE "Obligation" (
    "id" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "caseId" TEXT,
    "country" TEXT NOT NULL DEFAULT 'Argentina',
    "organism" TEXT NOT NULL,
    "category" "ObligationCategory" NOT NULL,
    "concept" TEXT NOT NULL,
    "period" TEXT,
    "dueDate" TIMESTAMP(3) NOT NULL,
    "amount" DOUBLE PRECISION,
    "status" "ObligationStatus" NOT NULL DEFAULT 'PENDING',
    "notes" TEXT,
    "eventId" TEXT,
    "paymentEntryId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Obligation_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "Obligation_eventId_key" ON "Obligation"("eventId");
CREATE UNIQUE INDEX "Obligation_paymentEntryId_key" ON "Obligation"("paymentEntryId");

ALTER TABLE "Obligation" ADD CONSTRAINT "Obligation_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Obligation" ADD CONSTRAINT "Obligation_caseId_fkey" FOREIGN KEY ("caseId") REFERENCES "Case"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Obligation" ADD CONSTRAINT "Obligation_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Obligation" ADD CONSTRAINT "Obligation_paymentEntryId_fkey" FOREIGN KEY ("paymentEntryId") REFERENCES "AccountEntry"("id") ON DELETE SET NULL ON UPDATE CASCADE;
