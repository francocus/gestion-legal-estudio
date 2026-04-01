"use server";

import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";
import {
  attachLegalSourceToCaseWithDeps,
  detachLegalSourceFromCaseWithDeps,
} from "@/lib/actions/services";
import { ActionResult } from "@/lib/actions/action-result";

export async function attachLegalSourceToCase(formData: FormData): Promise<ActionResult> {
  return attachLegalSourceToCaseWithDeps(formData, {
    attach(caseId, legalSourceId) {
      return db.caseLegalSource.upsert({
        where: {
          caseId_legalSourceId: {
            caseId,
            legalSourceId,
          },
        },
        update: {},
        create: {
          caseId,
          legalSourceId,
        },
      });
    },
    revalidatePath,
  });
}

export async function detachLegalSourceFromCase(formData: FormData): Promise<ActionResult> {
  return detachLegalSourceFromCaseWithDeps(formData, {
    detach(caseId, legalSourceId) {
      return db.caseLegalSource.delete({
        where: {
          caseId_legalSourceId: {
            caseId,
            legalSourceId,
          },
        },
      });
    },
    revalidatePath,
  });
}
