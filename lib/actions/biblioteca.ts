"use server";

import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";
import {
  createLegalSourceWithDeps,
  deleteLegalSourceWithDeps,
  validateManualLegalSourceWithDeps,
  verifyOfficialLegalSourceUpdateWithDeps,
} from "@/lib/actions/services";
import { ActionResult } from "@/lib/actions/action-result";
import { fetchOfficialLegalText } from "@/lib/legal-source-fetch";
import {
  analyzeLegalSourceSnapshot,
  analyzeOfficialLegalSourceVerification,
  summarizeOfficialLegalSource,
  summarizeManualLegalSource,
} from "@/lib/actions/ia";
import { detectOfficialLegalSource } from "@/lib/legal-source-officials";

export async function createLegalSource(formData: FormData): Promise<ActionResult> {
  const sourceUrl = String(formData.get("sourceUrl") ?? "").trim();
  const loadMode = String(formData.get("loadMode") ?? "AUTO");
  const country = String(formData.get("country") ?? "Argentina");
  const effectiveSourceUrl = sourceUrl;

  if (loadMode === "AUTO") {
    if (!effectiveSourceUrl) {
      return {
        success: false,
        error: country === "Argentina"
          ? "En la carga automatica tenes que pegar el link oficial de InfoLEG."
          : "En la carga automatica tenes que pegar el link oficial de una fuente valida de Paraguay.",
      };
    }

    if (effectiveSourceUrl && !detectOfficialLegalSource(effectiveSourceUrl, country).preferred) {
      return {
        success: false,
        error: country === "Argentina"
          ? "El link cargado no corresponde a una fuente oficial valida de InfoLEG."
          : "El link cargado no corresponde a una fuente oficial valida de Paraguay.",
      };
    }
  }

  const result = await createLegalSourceWithDeps(formData, {
    createLegalSource: async (data) => {
      return db.legalSource.create({ data });
    },
    revalidatePath,
  });

  if (result.success && result.id && detectOfficialLegalSource(effectiveSourceUrl, country).preferred) {
    const syncResult = await verifyOfficialLegalSourceUpdate(result.id);
    if (!syncResult.success) {
      await db.legalSource.delete({ where: { id: result.id } });
      revalidatePath("/biblioteca");
      return syncResult;
    }
    return syncResult;
  }

  return result;
}

export async function deleteLegalSource(id: string) {
  await deleteLegalSourceWithDeps(id, {
    deleteLegalSource: (legalSourceId) => db.legalSource.delete({ where: { id: legalSourceId } }),
    revalidatePath,
  });
}

export async function verifyOfficialLegalSourceUpdate(id: string): Promise<ActionResult> {
  return verifyOfficialLegalSourceUpdateWithDeps(id, {
    findLegalSource(legalSourceId) {
      return db.legalSource.findUnique({
        where: { id: legalSourceId },
        select: {
          id: true,
          title: true,
          type: true,
          area: true,
          country: true,
          content: true,
          officialText: true,
          sourceUrl: true,
          publicationDate: true,
          officialNumber: true,
          officialName: true,
          validityStatus: true,
          relatedRule: true,
          previousText: true,
        },
      });
    },
    fetchOfficialText(sourceUrl) {
      return fetchOfficialLegalText(sourceUrl);
    },
    analyzeOfficialVerification(input) {
      return analyzeOfficialLegalSourceVerification({
        title: input.title,
        content: input.content,
        country: input.country,
        area: input.area,
        type: input.type,
        originalContent: input.content,
        officialContent: input.officialContent,
        sourceUrl: input.sourceUrl,
      });
    },
    summarizeOfficialText(input) {
      return summarizeOfficialLegalSource({
        title: input.title,
        country: input.country,
        area: input.area,
        type: input.type,
        officialContent: input.officialContent,
      });
    },
    updateLegalSource(legalSourceId, data) {
      return db.legalSource.update({
        where: { id: legalSourceId },
        data,
      });
    },
    revalidatePath,
  });
}

export async function validateManualLegalSource(id: string): Promise<ActionResult> {
  return validateManualLegalSourceWithDeps(id, {
    findLegalSource(legalSourceId) {
      return db.legalSource.findUnique({
        where: { id: legalSourceId },
        select: {
          id: true,
          title: true,
          type: true,
          area: true,
          country: true,
          content: true,
          sourceUrl: true,
          officialNumber: true,
          publicationDate: true,
        },
      });
    },
    analyzeSnapshot(input) {
      return analyzeLegalSourceSnapshot(input);
    },
    summarizeManual(input) {
      return summarizeManualLegalSource({
        title: input.title,
        country: input.country,
        area: input.area,
        type: input.type,
        content: input.content,
        officialNumber: input.officialNumber,
      });
    },
    updateLegalSource(legalSourceId, data) {
      return db.legalSource.update({
        where: { id: legalSourceId },
        data,
      });
    },
    revalidatePath,
  });
}
