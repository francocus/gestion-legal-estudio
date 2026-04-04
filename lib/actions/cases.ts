"use server";

import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { getRequiredString } from "@/lib/actions/form-data";
import { createCaseWithDeps, editCaseWithDeps } from "@/lib/actions/services";
import { mkdir, unlink, writeFile } from "fs/promises";
import path from "path";
import { randomUUID } from "crypto";

function sanitizeFileName(fileName: string) {
  return fileName.replace(/[^a-zA-Z0-9._-]/g, "-");
}

export async function createCase(formData: FormData) {
  return createCaseWithDeps(formData, {
    createCase(data) {
      return db.case.create({ data });
    },
    revalidatePath,
  });
}

export async function editCase(formData: FormData) {
  return editCaseWithDeps(formData, {
    updateCase(id, data) {
      return db.case.update({
        where: { id },
        data,
      });
    },
    revalidatePath,
  });
}

export async function updateCaseFee(caseId: string, clientId: string, totalFee: number) {
  if (!caseId || !clientId) {
    return { success: false as const, error: "No se pudo identificar el expediente." };
  }

  await db.case.update({
    where: { id: caseId },
    data: { totalFee },
  });

  revalidatePath("/contabilidad");
  revalidatePath(`/client/${clientId}`);
  revalidatePath(`/client/${clientId}/case/${caseId}`);

  return { success: true as const };
}

export async function deleteCase(formData: FormData) {
  const id = getRequiredString(formData, "id");
  const clientId = getRequiredString(formData, "clientId");

  if (!id) return;

  await db.case.delete({ where: { id } });
  revalidatePath(`/client/${clientId}`);
}

export async function uploadCaseDocuments(formData: FormData): Promise<void> {
  const caseId = getRequiredString(formData, "caseId");
  const clientId = getRequiredString(formData, "clientId");
  const documents = formData
    .getAll("documents")
    .filter((item): item is File => item instanceof File && item.size > 0);

  if (!caseId || !clientId || documents.length === 0) {
    return;
  }

  const uploadDir = path.join(process.cwd(), "public", "uploads", "cases", caseId);
  await mkdir(uploadDir, { recursive: true });

  for (const file of documents) {
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const fileName = `${randomUUID()}-${sanitizeFileName(file.name)}`;
    const absolutePath = path.join(uploadDir, fileName);
    const publicPath = `/uploads/cases/${caseId}/${fileName}`;

    await writeFile(absolutePath, buffer);
    await db.caseDocument.create({
      data: {
        caseId,
        fileName: file.name,
        filePath: publicPath,
      },
    });
  }

  revalidatePath(`/client/${clientId}/case/${caseId}`);
}

export async function deleteCaseDocument(formData: FormData) {
  const id = getRequiredString(formData, "id");
  const caseId = getRequiredString(formData, "caseId");
  const clientId = getRequiredString(formData, "clientId");

  if (!id || !caseId || !clientId) {
    return;
  }

  const document = await db.caseDocument.findUnique({
    where: { id },
    select: { filePath: true },
  });

  if (document?.filePath) {
    const normalizedPath = document.filePath.replace(/^\/+/, "");
    const absolutePath = path.join(process.cwd(), "public", normalizedPath);
    try {
      await unlink(absolutePath);
    } catch {
      // Ignore missing files; the record is removed anyway.
    }
  }

  await db.caseDocument.delete({ where: { id } });
  revalidatePath(`/client/${clientId}/case/${caseId}`);
}
