"use server";

import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";
import {
  createLegalSourceWithDeps,
  deleteLegalSourceWithDeps,
} from "@/lib/actions/services";
import { ActionResult } from "@/lib/actions/action-result";
import { analyzeLegalSourceSnapshot, analyzeOfficialLegalSourceVerification } from "@/lib/actions/ia";
import { buildOfficialLegalSnapshot, fetchOfficialLegalText } from "@/lib/legal-source-fetch";
import { detectOfficialLegalSource, detectOfficialStatusSignals } from "@/lib/legal-source-officials";

export async function createLegalSource(formData: FormData): Promise<ActionResult> {
  let createdSourceId: string | null = null;
  let createdTitle: string | null = null;
  let createdContent: string | null = null;
  let createdCountry: string | null = null;
  let createdArea: string | null = null;
  let createdType: string | null = null;
  let createdSourceUrl: string | null = null;

  const result = await createLegalSourceWithDeps(formData, {
    createLegalSource: async (data) => {
      const source = await db.legalSource.create({ data });
      createdSourceId = source.id;
      createdTitle = source.title;
      createdContent = source.content;
      createdCountry = source.country;
      createdArea = source.area;
      createdType = source.type;
      createdSourceUrl = source.sourceUrl;
      return source;
    },
    revalidatePath,
  });

  if (
    result.success &&
    createdSourceId &&
    createdTitle &&
    createdContent &&
    createdCountry &&
    createdArea &&
    createdType
  ) {
    const originalContent = createdContent as string;
    let contentToAnalyze: string = originalContent;
    let fetchedOfficialText: string | null = null;
    const officialSource = detectOfficialLegalSource(createdSourceUrl, createdCountry);

    if (createdSourceUrl) {
      fetchedOfficialText = await fetchOfficialLegalText(createdSourceUrl);
    }

    if (fetchedOfficialText && fetchedOfficialText !== originalContent) {
      const officialSnapshot = buildOfficialLegalSnapshot(createdSourceUrl ?? "", fetchedOfficialText, createdCountry);
      await db.legalSource.update({
        where: { id: createdSourceId },
        data: {
          title: officialSnapshot.normalizedTitle ?? createdTitle,
          previousText: originalContent,
          content: officialSnapshot.normalizedContent,
        },
      });
      createdTitle = officialSnapshot.normalizedTitle ?? createdTitle;
      contentToAnalyze = officialSnapshot.normalizedContent;
      fetchedOfficialText = officialSnapshot.officialText;
    }

    const statusSignals = fetchedOfficialText ? detectOfficialStatusSignals(fetchedOfficialText) : { shouldReview: false };

    const aiResult = statusSignals.shouldReview
      ? { success: true as const, status: "REVISAR" as const }
      : fetchedOfficialText && officialSource.recognized
        ? await analyzeOfficialLegalSourceVerification({
            title: createdTitle,
            content: contentToAnalyze,
            originalContent,
            officialContent: fetchedOfficialText,
            sourceUrl: createdSourceUrl ?? "",
            country: createdCountry,
            area: createdArea,
            type: createdType,
          })
        : await analyzeLegalSourceSnapshot({
            title: createdTitle,
            content: contentToAnalyze,
            country: createdCountry,
            area: createdArea,
            type: createdType,
          });

    if (aiResult.success) {
      await db.legalSource.update({
        where: { id: createdSourceId },
        data: {
          lastAiCheck: new Date(),
          isOutdated: aiResult.status === "REVISAR",
        },
      });
      revalidatePath("/biblioteca");
    }
  }

  return result;
}

export async function deleteLegalSource(id: string) {
  await deleteLegalSourceWithDeps(id, {
    deleteLegalSource: (legalSourceId) => db.legalSource.delete({ where: { id: legalSourceId } }),
    revalidatePath,
  });
}
