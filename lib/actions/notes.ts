"use server";

import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { ActionResult } from "@/lib/actions/action-result";
import { createNoteWithDeps, deleteNoteWithDeps } from "@/lib/actions/services";

export async function createNote(
  caseId: string,
  clientId: string,
  content: string,
  type: string = "TEXT"
): Promise<ActionResult> {
  return createNoteWithDeps(caseId, clientId, content, type, {
    createNote: (data) => db.note.create({ data }),
    revalidatePath,
  });
}

export async function deleteNote(noteId: string, caseId: string, clientId: string) {
  await deleteNoteWithDeps(noteId, caseId, clientId, {
    deleteNote: (id) => db.note.delete({ where: { id } }),
    revalidatePath,
  });
}
