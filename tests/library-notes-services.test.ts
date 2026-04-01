import assert from "node:assert/strict";
import {
  createLegalSourceWithDeps,
  createNoteWithDeps,
  deleteLegalSourceWithDeps,
  deleteNoteWithDeps,
  markLegalSourceReviewedWithDeps,
} from "@/lib/actions/services";

function createFormData(values: Record<string, string>) {
  const formData = new FormData();

  for (const [key, value] of Object.entries(values)) {
    formData.set(key, value);
  }

  return formData;
}

async function runTest(name: string, fn: () => Promise<void> | void) {
  try {
    await fn();
    console.log(`PASS ${name}`);
  } catch (error) {
    console.error(`FAIL ${name}`);
    throw error;
  }
}

void (async () => {
  await runTest("createLegalSourceWithDeps creates source and revalidates library", async () => {
    let created: Record<string, unknown> | null = null;
    const calls: string[] = [];

    const result = await createLegalSourceWithDeps(
      createFormData({
        title: "Ley 123",
        type: "LAW",
        area: "civil",
        country: "Argentina",
        content: "Texto vigente",
        sourceUrl: "https://example.com/norma",
      }),
      {
        async createLegalSource(data) {
          created = data;
          return null;
        },
        revalidatePath(path) {
          calls.push(path);
        },
      }
    );

    assert.deepEqual(result, { success: true });
    assert.deepEqual(created, {
      title: "Ley 123",
      type: "LAW",
      area: "CIVIL",
      country: "Argentina",
      content: "Texto vigente",
      sourceUrl: "https://example.com/norma",
    });
    assert.deepEqual(calls, ["/biblioteca"]);
  });

  await runTest("createLegalSourceWithDeps rejects incomplete payload", async () => {
    const result = await createLegalSourceWithDeps(createFormData({ title: "", type: "", area: "", content: "" }), {
      async createLegalSource() {
        throw new Error("no deberia crear");
      },
      revalidatePath() {},
    });

    assert.deepEqual(result, { success: false, error: "Faltan datos obligatorios de la fuente juridica." });
  });

  await runTest("deleteLegalSourceWithDeps deletes and revalidates library", async () => {
    let deletedId: string | null = null;
    const calls: string[] = [];

    await deleteLegalSourceWithDeps("source-1", {
      async deleteLegalSource(id) {
        deletedId = id;
        return null;
      },
      revalidatePath(path) {
        calls.push(path);
      },
    });

    assert.equal(deletedId, "source-1");
    assert.deepEqual(calls, ["/biblioteca"]);
  });

  await runTest("markLegalSourceReviewedWithDeps updates and revalidates library", async () => {
    let reviewedId: string | null = null;
    const calls: string[] = [];

    await markLegalSourceReviewedWithDeps("source-2", {
      async markReviewed(id) {
        reviewedId = id;
        return null;
      },
      revalidatePath(path) {
        calls.push(path);
      },
    });

    assert.equal(reviewedId, "source-2");
    assert.deepEqual(calls, ["/biblioteca"]);
  });

  await runTest("createNoteWithDeps creates note and revalidates case detail", async () => {
    let created: Record<string, unknown> | null = null;
    const calls: string[] = [];

    const result = await createNoteWithDeps("case-1", "client-1", "  idea principal  ", "TEXT", {
      async createNote(data) {
        created = data;
        return null;
      },
      revalidatePath(path) {
        calls.push(path);
      },
    });

    assert.deepEqual(result, { success: true });
    assert.deepEqual(created, {
      content: "idea principal",
      type: "TEXT",
      caseId: "case-1",
    });
    assert.deepEqual(calls, ["/client/client-1/case/case-1"]);
  });

  await runTest("createNoteWithDeps rejects empty content", async () => {
    const result = await createNoteWithDeps("case-1", "client-1", "   ", "TEXT", {
      async createNote() {
        throw new Error("no deberia crear");
      },
      revalidatePath() {},
    });

    assert.deepEqual(result, { success: false, error: "La nota no puede estar vacia." });
  });

  await runTest("deleteNoteWithDeps deletes note and revalidates case detail", async () => {
    let deletedId: string | null = null;
    const calls: string[] = [];

    await deleteNoteWithDeps("note-9", "case-9", "client-9", {
      async deleteNote(id) {
        deletedId = id;
        return null;
      },
      revalidatePath(path) {
        calls.push(path);
      },
    });

    assert.equal(deletedId, "note-9");
    assert.deepEqual(calls, ["/client/client-9/case/case-9"]);
  });
})();
