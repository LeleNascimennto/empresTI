import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { AppShell } from "@/components/app-shell";

export default async function AppLayout({ children }: Readonly<{ children: ReactNode }>) {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getClaims();

  if (error || !data?.claims?.sub) {
    redirect("/login");
  }

  const email = typeof data.claims.email === "string" ? data.claims.email : "Conta ativa";

  return <AppShell email={email}>{children}</AppShell>;
}
