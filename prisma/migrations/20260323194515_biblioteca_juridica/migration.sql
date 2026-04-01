-- CreateEnum
CREATE TYPE "LegalSourceType" AS ENUM ('LAW', 'CODE', 'CONSTITUTION', 'JURISPRUDENCE', 'OTHER');

-- CreateTable
CREATE TABLE "LegalSource" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "type" "LegalSourceType" NOT NULL,
    "area" TEXT NOT NULL,
    "country" TEXT NOT NULL DEFAULT 'Argentina',
    "content" TEXT NOT NULL,
    "sourceUrl" TEXT,
    "publicationDate" TIMESTAMP(3),
    "lastAiCheck" TIMESTAMP(3),
    "isOutdated" BOOLEAN NOT NULL DEFAULT false,
    "previousText" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LegalSource_pkey" PRIMARY KEY ("id")
);
