import { LoginForm } from "@/components/login-form";

interface LoginPageProps {
  searchParams?: Promise<{
    switch?: string;
    email?: string;
    name?: string;
  }>;
}

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const params = (await searchParams) || {};

  return (
    <LoginForm
      isSwitchUser={params.switch === "1"}
      email={params.email || ""}
      name={params.name || ""}
    />
  );
}
