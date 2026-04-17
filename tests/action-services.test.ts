import assert from "node:assert/strict";
import {
  createAccountEntryWithDeps,
  createAgendaEventWithDeps,
  createCaseWithDeps,
  createClientWithDeps,
  createMovementWithDeps,
  createTransactionWithDeps,
  deleteAccountEntryWithDeps,
  deleteAgendaEventWithDeps,
  deleteClientWithDeps,
  deleteMovementWithDeps,
  deleteUserWithDeps,
  registerUserWithDeps,
  updateClientWithDeps,
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

type ClientPayload = {
  firstName: string;
  lastName: string;
  email: string | null;
  phone?: string | null;
};

void (async () => {
  await runTest("createTransactionWithDeps writes to db and revalidates detail route", async () => {
    const calls: string[] = [];
    let created: Record<string, unknown> | null = null;

    const result = await createTransactionWithDeps(
      createFormData({
        caseId: "case-1",
        clientId: "client-1",
        description: "Pago parcial",
        amount: "25000",
        type: "INCOME",
      }),
    {
      async createTransaction(data) {
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
      caseId: "case-1",
      description: "Pago parcial",
      amount: 25000,
      type: "INCOME",
    });
    assert.deepEqual(calls, ["/client/client-1/case/case-1"]);
  });

  await runTest("createTransactionWithDeps skips invalid amounts", async () => {
    let called = false;
    const calls: string[] = [];

    const result = await createTransactionWithDeps(
      createFormData({
        caseId: "case-1",
        clientId: "client-1",
        description: "Pago parcial",
        amount: "0",
        type: "INCOME",
      }),
    {
      async createTransaction() {
        called = true;
        return null;
      },
      revalidatePath(path) {
        calls.push(path);
        },
      }
    );

    assert.deepEqual(result, { success: false, error: "Faltan datos obligatorios del movimiento de caja." });
    assert.equal(called, false);
    assert.deepEqual(calls, []);
  });

  await runTest("createAgendaEventWithDeps creates event and revalidates agenda", async () => {
    let created: Record<string, unknown> | null = null;
    const calls: string[] = [];

    const result = await createAgendaEventWithDeps(
      createFormData({
        title: "Audiencia",
        date: "2026-04-04",
        type: "HEARING",
        description: "Sala 1",
        caseId: "",
      }),
    {
      async createEvent(data) {
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
      title: "Audiencia",
      date: new Date("2026-04-04"),
      type: "HEARING",
      description: "Sala 1",
      caseId: null,
      clientId: null,
      appointmentStatus: null,
      appointmentMode: null,
      durationMinutes: null,
      depositAmount: null,
      depositPaid: false,
    });
    assert.deepEqual(calls, ["/agenda", "/contabilidad"]);
  });

  await runTest("createAgendaEventWithDeps rejects invalid payload", async () => {
    const result = await createAgendaEventWithDeps(
      createFormData({
        title: "",
        date: "fecha-invalida",
        type: "",
        description: "",
        caseId: "",
      }),
      {
        async createEvent() {
          throw new Error("no deberia crear");
        },
        revalidatePath() {},
      }
    );

    assert.deepEqual(result, { success: false, error: "Faltan datos obligatorios del evento." });
  });

  await runTest("deleteAgendaEventWithDeps revalidates agenda home and case route", async () => {
    const calls: string[] = [];
    let deletedId: string | null = null;

    await deleteAgendaEventWithDeps(
      createFormData({
        id: "event-1",
        clientId: "client-9",
        caseId: "case-9",
      }),
    {
      async deleteEvent(id) {
        deletedId = id;
        return null;
      },
      revalidatePath(path) {
        calls.push(path);
        },
      }
    );

    assert.equal(deletedId, "event-1");
    assert.deepEqual(calls, ["/agenda", "/", "/client/client-9/case/case-9"]);
  });

  await runTest("createCaseWithDeps persists extrajudicial case and revalidates client page", async () => {
    let created: Record<string, unknown> | null = null;
    const calls: string[] = [];

    const result = await createCaseWithDeps(
      createFormData({
        clientId: "client-3",
        caratula: "Cobranza",
        description: "Gestión administrativa",
        area: "COBRANZAS",
        isExtrajudicial: "true",
        code: "EXP-123",
        juzgado: "Civil 1",
      }),
    {
      async createCase(data) {
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
      caratula: "Cobranza",
      code: null,
      juzgado: null,
      description: "Gestión administrativa",
      clientId: "client-3",
      area: "COBRANZAS",
      isExtrajudicial: true,
    });
    assert.deepEqual(calls, ["/client/client-3"]);

    assert.deepEqual(
      await createCaseWithDeps(
        createFormData({
          clientId: "",
          caratula: "",
          description: "",
          area: "",
          isExtrajudicial: "false",
          code: "",
          juzgado: "",
        }),
        {
          async createCase() {
            throw new Error("no deberia crear");
          },
          revalidatePath() {},
        }
      ),
      { success: false, error: "Faltan datos obligatorios del expediente." }
    );
  });

  await runTest("createClientWithDeps persists normalized payload and revalidates home", async () => {
    let created: unknown = null;
    const calls: string[] = [];

    const result = await createClientWithDeps(
      createFormData({
        firstName: " Ana ",
        lastName: " Lopez ",
        docType: "DNI",
        dni: "30111222",
        email: " ana@test.com ",
        birthDate: "1992-01-10",
      }),
      {
        async createClient(data) {
          created = data;
          return null;
        },
        revalidatePath(path) {
          calls.push(path);
        },
      }
    );

    assert.deepEqual(result, { success: true });
    assert.ok(created);
    const createdClient = created as ClientPayload;
    assert.equal(createdClient.firstName, "Ana");
    assert.equal(createdClient.lastName, "Lopez");
    assert.equal(createdClient.email, "ana@test.com");
    assert.deepEqual(calls, ["/"]);

    assert.deepEqual(
      await createClientWithDeps(
        createFormData({
          firstName: "",
          lastName: "",
          docType: "DNI",
        }),
        {
          async createClient() {
            throw new Error("no deberia crear");
          },
          revalidatePath() {},
        }
      ),
      { success: false, error: "Nombre y apellido son obligatorios." }
    );
  });

  await runTest("updateClientWithDeps revalidates client detail and home", async () => {
    let updatedId: string | null = null;
    let updatedPayload: unknown = null;
    const calls: string[] = [];

    await updateClientWithDeps(
      createFormData({
        id: "client-7",
        firstName: " Juan ",
        lastName: " Perez ",
        docType: "DNI",
        phone: " 341123123 ",
      }),
      {
        async updateClient(id, data) {
          updatedId = id;
          updatedPayload = data;
          return null;
        },
        revalidatePath(path) {
          calls.push(path);
        },
      }
    );

    assert.equal(updatedId, "client-7");
    assert.ok(updatedPayload);
    const updatedClient = updatedPayload as ClientPayload;
    assert.equal(updatedClient.phone, "341123123");
    assert.deepEqual(calls, ["/client/client-7", "/"]);

    assert.deepEqual(
      await updateClientWithDeps(
        createFormData({
          id: "",
          firstName: "Juan",
          lastName: "Perez",
          docType: "DNI",
        }),
        {
          async updateClient() {
            throw new Error("no deberia actualizar");
          },
          revalidatePath() {},
        }
      ),
      { success: false, error: "No se pudo identificar el cliente a actualizar." }
    );
  });

  await runTest("deleteClientWithDeps deletes by id and revalidates home", async () => {
    let deletedId: string | null = null;
    const calls: string[] = [];

    await deleteClientWithDeps(createFormData({ id: "client-4" }), {
      async deleteClient(id) {
        deletedId = id;
        return null;
      },
      revalidatePath(path) {
        calls.push(path);
      },
    });

    assert.equal(deletedId, "client-4");
    assert.deepEqual(calls, ["/"]);
  });

  await runTest("registerUserWithDeps rejects duplicate emails", async () => {
    let created = false;
    const calls: string[] = [];

    const result = await registerUserWithDeps(
      undefined,
      createFormData({
        name: "Abogada Jr",
        email: "jr@test.com",
        password: "secret",
      }),
      {
        async findUserByEmail() {
          return { id: "user-1" };
        },
        async hashPassword() {
          return "hashed";
        },
        async createUser() {
          created = true;
          return null;
        },
        revalidatePath(path) {
          calls.push(path);
        },
      }
    );

    assert.deepEqual(result, { error: "Este email ya está registrado." });
    assert.equal(created, false);
    assert.deepEqual(calls, []);
  });

  await runTest("registerUserWithDeps hashes password creates user and revalidates team", async () => {
    let hashedInput: string | null = null;
    let created: Record<string, unknown> | null = null;
    const calls: string[] = [];

    const result = await registerUserWithDeps(
      undefined,
      createFormData({
        name: " Socio ",
        email: " socio@test.com ",
        password: "clave123",
        role: "ADMIN",
      }),
      {
        async findUserByEmail() {
          return null;
        },
        async hashPassword(password) {
          hashedInput = password;
          return "hashed-clave";
        },
        async createUser(data) {
          created = data;
          return null;
        },
        revalidatePath(path) {
          calls.push(path);
        },
      }
    );

    assert.equal(hashedInput, "clave123");
    assert.deepEqual(created, {
      name: "Socio",
      email: "socio@test.com",
      password: "hashed-clave",
      role: "ADMIN",
      mustChangePassword: true,
    });
    assert.deepEqual(result, { success: "Usuario creado correctamente." });
    assert.deepEqual(calls, ["/team"]);
  });

  await runTest("deleteUserWithDeps deletes by id and revalidates team", async () => {
    let deletedId: string | null = null;
    const calls: string[] = [];

    await deleteUserWithDeps(createFormData({ id: "user-8" }), {
      async findUserById(id) {
        return { id, email: "jr@test.com", role: "USER", status: "ACTIVE" };
      },
      async countActiveAdmins() {
        return 2;
      },
      async deleteUser(id) {
        deletedId = id;
        return null;
      },
      revalidatePath(path) {
        calls.push(path);
      },
    });

    assert.equal(deletedId, "user-8");
    assert.deepEqual(calls, ["/team"]);
  });

  await runTest("createMovementWithDeps creates movement and revalidates case detail", async () => {
    let created: Record<string, unknown> | null = null;
    const calls: string[] = [];

    await createMovementWithDeps(
      createFormData({
        caseId: "case-10",
        clientId: "client-10",
        title: "Cédula recibida",
        description: "Se notificó traslado",
        date: "2026-05-02",
      }),
      {
        async createMovement(data) {
          created = data;
          return { id: "movement-1" };
        },
        revalidatePath(path) {
          calls.push(path);
        },
      }
    );

    assert.deepEqual(created, {
      caseId: "case-10",
      title: "Cédula recibida",
      description: "Se notificó traslado",
      date: new Date("2026-05-02"),
    });
    assert.deepEqual(calls, ["/client/client-10/case/case-10"]);
    assert.deepEqual(
      await createMovementWithDeps(
        createFormData({
          caseId: "",
          clientId: "client-10",
          title: "",
          description: "",
          date: "fecha-invalida",
        }),
        {
          async createMovement() {
            throw new Error("no deberia crear");
          },
          revalidatePath() {},
        }
      ),
      { success: false, error: "Faltan datos obligatorios del movimiento." }
    );
  });

  await runTest("deleteMovementWithDeps deletes movement and revalidates case detail", async () => {
    let deletedId: string | null = null;
    const calls: string[] = [];

    await deleteMovementWithDeps(
      createFormData({
        id: "mov-1",
        clientId: "client-22",
        caseId: "case-22",
      }),
      {
        async deleteMovement(id) {
          deletedId = id;
          return null;
        },
        revalidatePath(path) {
          calls.push(path);
        },
      }
    );

    assert.equal(deletedId, "mov-1");
    assert.deepEqual(calls, ["/client/client-22/case/case-22"]);
  });

  await runTest("createAccountEntryWithDeps creates entry and revalidates accounting plus case view", async () => {
    let created: Record<string, unknown> | null = null;
    const calls: string[] = [];

    const result = await createAccountEntryWithDeps(
      {
        date: "2026-05-03",
        description: "Pago de tasa",
        concept: "Tasa judicial",
        debe: 15000,
        haber: 0,
        caseId: "case-30",
      },
      {
        async createAccountEntry(data) {
          created = data;
          return { id: "acc-1" };
        },
        revalidatePath(path) {
          calls.push(path);
        },
      }
    );

      assert.deepEqual(created, {
        date: new Date("2026-05-03T12:00:00"),
        description: "Pago de tasa",
        concept: "Tasa judicial",
        debe: 15000,
      haber: 0,
      caseId: "case-30",
    });
    assert.deepEqual(result, { success: true, entry: { id: "acc-1" } });
    assert.deepEqual(calls, ["/contabilidad", "/client/[id]/case/case-30"]);
    assert.deepEqual(
      await createAccountEntryWithDeps(
        {
          date: "fecha-invalida",
          description: "",
          concept: "Tasa judicial",
          debe: 15000,
          haber: 0,
        },
        {
          async createAccountEntry() {
            throw new Error("no deberia crear");
          },
          revalidatePath() {},
        }
      ),
      { success: false, error: "Faltan datos obligatorios del movimiento contable." }
    );
  });

  await runTest("deleteAccountEntryWithDeps deletes entry and revalidates accounting", async () => {
    let deletedId: string | null = null;
    const calls: string[] = [];

    const result = await deleteAccountEntryWithDeps("acc-2", undefined, {
      async deleteAccountEntry(id) {
        deletedId = id;
        return null;
      },
      revalidatePath(path) {
        calls.push(path);
      },
    });

    assert.equal(deletedId, "acc-2");
    assert.equal(result, true);
    assert.deepEqual(calls, ["/contabilidad"]);
  });
})();
