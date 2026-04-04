"use server";

import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { createMovementWithDeps, deleteMovementWithDeps } from "@/lib/actions/services";
import { mkdir, unlink, writeFile } from "fs/promises";
import path from "path";
import { randomUUID } from "crypto";

function sanitizeFileName(fileName: string) {
  return fileName.replace(/[^a-zA-Z0-9._-]/g, "-");
}

export async function createMovement(formData: FormData) {
  return createMovementWithDeps(formData, {
    createMovement(data) {
      return db.movement.create({
        data,
        select: { id: true },
      });
    },
    async saveDocument(movementId, file) {
      const bytes = await file.arrayBuffer();
      const buffer = Buffer.from(bytes);
      const movement = await db.movement.findUnique({
        where: { id: movementId },
        select: { caseId: true },
      });

      if (!movement) {
        return;
      }

      const uploadDir = path.join(process.cwd(), "public", "uploads", "cases", movement.caseId);
      await mkdir(uploadDir, { recursive: true });

      const fileName = `${randomUUID()}-${sanitizeFileName(file.name)}`;
      const absolutePath = path.join(uploadDir, fileName);
      const publicPath = `/uploads/cases/${movement.caseId}/${fileName}`;

      await writeFile(absolutePath, buffer);
      await db.movementDocument.create({
        data: {
          movementId,
          fileName: file.name,
          filePath: publicPath,
        },
      });
    },
    revalidatePath,
  });
}

export async function deleteMovement(formData: FormData) {
  return deleteMovementWithDeps(formData, {
    listDocuments(movementId) {
      return db.movementDocument.findMany({
        where: { movementId },
        select: { filePath: true },
      });
    },
    async removeStoredFile(filePath) {
      const normalizedPath = filePath.replace(/^\/+/, "");
      const absolutePath = path.join(process.cwd(), "public", normalizedPath);
      try {
        await unlink(absolutePath);
      } catch {
        // Ignore missing files; the DB record will be removed by cascade.
      }
    },
    deleteMovement(id) {
      return db.movement.delete({ where: { id } });
    },
    revalidatePath,
  });
}
