-- CreateTable
CREATE TABLE "MovementDocument" (
    "id" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "filePath" TEXT NOT NULL,
    "uploadedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "movementId" TEXT NOT NULL,

    CONSTRAINT "MovementDocument_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "MovementDocument"
ADD CONSTRAINT "MovementDocument_movementId_fkey"
FOREIGN KEY ("movementId") REFERENCES "Movement"("id")
ON DELETE CASCADE ON UPDATE CASCADE;
