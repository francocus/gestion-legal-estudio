"use server";

import bcrypt from "bcryptjs";
import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";
import {
  changeOwnPasswordWithDeps,
  deleteUserWithDeps,
  registerUserWithDeps,
  resetUserPasswordWithDeps,
  setUserStatusWithDeps,
  updateUserWithDeps,
} from "@/lib/actions/services";

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
      return db.user.create({ data, select: { id: true } });
    },
    createAuditLog(data) {
      return db.userAuditLog.create({ data });
    },
    revalidatePath,
  });
}

export async function updateUser(formData: FormData) {
  return updateUserWithDeps(formData, {
    findUserById(id) {
      return db.user.findUnique({
        where: { id },
        select: { id: true, email: true, role: true, status: true },
      });
    },
    countActiveAdmins() {
      return db.user.count({
        where: { role: "ADMIN", status: "ACTIVE" },
      });
    },
    findUserByEmail(email) {
      return db.user.findUnique({
        where: { email },
        select: { id: true },
      });
    },
    updateUser(id, data) {
      return db.user.update({ where: { id }, data });
    },
    createAuditLog(data) {
      return db.userAuditLog.create({ data });
    },
    revalidatePath,
  });
}

export async function resetUserPassword(formData: FormData) {
  return resetUserPasswordWithDeps(formData, {
    hashPassword(password) {
      return bcrypt.hash(password, 10);
    },
    updatePassword(id, data) {
      return db.user.update({ where: { id }, data });
    },
    createAuditLog(data) {
      return db.userAuditLog.create({ data });
    },
    revalidatePath,
  });
}

export async function changeOwnPassword(formData: FormData) {
  return changeOwnPasswordWithDeps(formData, {
    findUserByEmail(email) {
      return db.user.findUnique({
        where: { email },
        select: { id: true, password: true },
      });
    },
    comparePassword(plain, hashed) {
      return bcrypt.compare(plain, hashed);
    },
    hashPassword(password) {
      return bcrypt.hash(password, 10);
    },
    updatePassword(id, data) {
      return db.user.update({ where: { id }, data });
    },
    createAuditLog(data) {
      return db.userAuditLog.create({ data });
    },
  });
}

export async function setUserStatus(formData: FormData) {
  return setUserStatusWithDeps(formData, {
    findUserById(id) {
      return db.user.findUnique({
        where: { id },
        select: { id: true, email: true, role: true, status: true },
      });
    },
    countActiveAdmins() {
      return db.user.count({
        where: { role: "ADMIN", status: "ACTIVE" },
      });
    },
    updateStatus(id, data) {
      return db.user.update({
        where: { id },
        data: { status: data.status },
      });
    },
    createAuditLog(data) {
      return db.userAuditLog.create({ data });
    },
    revalidatePath,
  });
}

export async function deleteUser(formData: FormData) {
  return deleteUserWithDeps(formData, {
    findUserById(id) {
      return db.user.findUnique({
        where: { id },
        select: { id: true, email: true, role: true, status: true },
      });
    },
    countActiveAdmins() {
      return db.user.count({
        where: { role: "ADMIN", status: "ACTIVE" },
      });
    },
    deleteUser(id) {
      return db.user.delete({ where: { id } });
    },
    createAuditLog(data) {
      return db.userAuditLog.create({ data });
    },
    revalidatePath,
  });
}
