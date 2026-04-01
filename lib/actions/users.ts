"use server";

import bcrypt from "bcryptjs";
import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { deleteUserWithDeps, registerUserWithDeps } from "@/lib/actions/services";

export async function registerUser(
  prevState: { error?: string; success?: string } | undefined,
  formData: FormData
) {
  return registerUserWithDeps(prevState, formData, {
    findUserByEmail(email) {
      return db.user.findUnique({
        where: { email },
        select: { id: true },
      });
    },
    hashPassword(password) {
      return bcrypt.hash(password, 10);
    },
    createUser(data) {
      return db.user.create({ data });
    },
    revalidatePath,
  });
}

export async function deleteUser(formData: FormData) {
  return deleteUserWithDeps(formData, {
    deleteUser(id) {
      return db.user.delete({ where: { id } });
    },
    revalidatePath,
  });
}
