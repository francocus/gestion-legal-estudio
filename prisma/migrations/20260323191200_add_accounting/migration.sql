-- CreateTable
CREATE TABLE "AccountEntry" (
    "id" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "description" TEXT NOT NULL,
    "concept" TEXT NOT NULL,
    "debe" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "haber" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "caseId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AccountEntry_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "AccountEntry" ADD CONSTRAINT "AccountEntry_caseId_fkey" FOREIGN KEY ("caseId") REFERENCES "Case"("id") ON DELETE SET NULL ON UPDATE CASCADE;
