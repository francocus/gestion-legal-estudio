"use server";

import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { createMovementWithDeps, deleteMovementWithDeps } from "@/lib/actions/services";

export async function createMovement(formData: FormData) {
  return createMovementWithDeps(formData, {
    createMovement(data) {
      return db.movement.create({ data });
    },
    revalidatePath,
  });
}

export async function deleteMovement(formData: FormData) {
  return deleteMovementWithDeps(formData, {
    deleteMovement(id) {
      return db.movement.delete({ where: { id } });
    },
    revalidatePath,
  });
}
