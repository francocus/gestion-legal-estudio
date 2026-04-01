import assert from "node:assert/strict";
import {
  attachLegalSourceToCaseWithDeps,
  detachLegalSourceFromCaseWithDeps,
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
  await runTest("attachLegalSourceToCaseWithDeps links source and revalidates case page", async () => {
    const calls: string[] = [];
    let attached: { caseId: string; legalSourceId: string } | null = null;

    const result = await attachLegalSourceToCaseWithDeps(
      createFormData({
        caseId: "case-1",
        clientId: "client-1",
        legalSourceId: "source-1",
      }),
      {
        async attach(caseId, legalSourceId) {
          attached = { caseId, legalSourceId };
          return null;
        },
        revalidatePath(path) {
          calls.push(path);
        },
      }
    );

    assert.deepEqual(result, { success: true });
    assert.deepEqual(attached, { caseId: "case-1", legalSourceId: "source-1" });
    assert.deepEqual(calls, ["/client/client-1/case/case-1"]);
  });

  await runTest("attachLegalSourceToCaseWithDeps rejects incomplete payload", async () => {
    const result = await attachLegalSourceToCaseWithDeps(
      createFormData({
        caseId: "",
        clientId: "client-1",
        legalSourceId: "",
      }),
      {
        async attach() {
          throw new Error("no deberia vincular");
        },
        revalidatePath() {},
      }
    );

    assert.deepEqual(result, {
      success: false,
      error: "No se pudo vincular la fuente juridica al expediente.",
    });
  });

  await runTest("detachLegalSourceFromCaseWithDeps unlinks source and revalidates case page", async () => {
    const calls: string[] = [];
    let detached: { caseId: string; legalSourceId: string } | null = null;

    const result = await detachLegalSourceFromCaseWithDeps(
      createFormData({
        caseId: "case-9",
        clientId: "client-9",
        legalSourceId: "source-9",
      }),
      {
        async detach(caseId, legalSourceId) {
          detached = { caseId, legalSourceId };
          return null;
        },
        revalidatePath(path) {
          calls.push(path);
        },
      }
    );

    assert.deepEqual(result, { success: true });
    assert.deepEqual(detached, { caseId: "case-9", legalSourceId: "source-9" });
    assert.deepEqual(calls, ["/client/client-9/case/case-9"]);
  });
})();
