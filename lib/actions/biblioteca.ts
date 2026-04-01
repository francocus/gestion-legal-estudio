"use server";

import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";
import {
  createLegalSourceWithDeps,
  deleteLegalSourceWithDeps,
  markLegalSourceReviewedWithDeps,
} from "@/lib/actions/services";
import { ActionResult } from "@/lib/actions/action-result";

export async function createLegalSource(formData: FormData): Promise<ActionResult> {
  return createLegalSourceWithDeps(formData, {
    createLegalSource: (data) => db.legalSource.create({ data }),
    revalidatePath,
  });
}

export async function deleteLegalSource(id: string) {
  await deleteLegalSourceWithDeps(id, {
    deleteLegalSource: (legalSourceId) => db.legalSource.delete({ where: { id: legalSourceId } }),
    revalidatePath,
  });
}

export async function markAsReviewed(id: string) {
  await markLegalSourceReviewedWithDeps(id, {
    markReviewed: (legalSourceId) =>
      db.legalSource.update({
        where: { id: legalSourceId },
        data: { isOutdated: false },
      }),
    revalidatePath,
  });
}
