"use server";

import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { createClientWithDeps, deleteClientWithDeps, updateClientWithDeps } from "@/lib/actions/services";

export async function createClient(formData: FormData) {
  return createClientWithDeps(formData, {
    createClient(data) {
      return db.client.create({ data });
    },
    revalidatePath,
  });
}

export async function updateClient(formData: FormData) {
  return updateClientWithDeps(formData, {
    updateClient(id, data) {
      return db.client.update({
        where: { id },
        data,
      });
    },
    revalidatePath,
  });
}

export async function deleteClient(formData: FormData) {
  return deleteClientWithDeps(formData, {
    deleteClient(id) {
      return db.client.delete({ where: { id } });
    },
    revalidatePath,
  });
}
