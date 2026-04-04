import { auth } from "@/auth";
import { ChangePasswordForm } from "@/components/change-password-form";
import { db } from "@/lib/db";
import { redirect } from "next/navigation";

export default async function ChangePasswordPage() {
  const session = await auth();

  if (!session?.user?.email) {
    redirect("/login");
  }

  const user = await db.user.findUnique({
    where: { email: session.user.email },
    select: { email: true, name: true, mustChangePassword: true },
  });

  if (!user) {
    redirect("/login");
  }

  if (!user.mustChangePassword) {
    redirect("/");
  }

  return <ChangePasswordForm email={user.email} name={user.name} />;
}
