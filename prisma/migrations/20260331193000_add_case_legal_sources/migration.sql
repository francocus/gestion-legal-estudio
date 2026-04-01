-- CreateTable
CREATE TABLE "CaseLegalSource" (
    "id" TEXT NOT NULL,
    "caseId" TEXT NOT NULL,
    "legalSourceId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CaseLegalSource_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "CaseLegalSource_caseId_legalSourceId_key" ON "CaseLegalSource"("caseId", "legalSourceId");

-- AddForeignKey
ALTER TABLE "CaseLegalSource" ADD CONSTRAINT "CaseLegalSource_caseId_fkey" FOREIGN KEY ("caseId") REFERENCES "Case"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CaseLegalSource" ADD CONSTRAINT "CaseLegalSource_legalSourceId_fkey" FOREIGN KEY ("legalSourceId") REFERENCES "LegalSource"("id") ON DELETE CASCADE ON UPDATE CASCADE;
