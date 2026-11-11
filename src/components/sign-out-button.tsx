"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function SignOutButton() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function signOut() {
    setIsSubmitting(true);
    await fetch("/api/auth/logout", { method: "POST" });
    router.replace("/login");
    router.refresh();
  }

  return (
    <button
      className="h-9 rounded-[8px] border border-[#2B3450] bg-transparent px-4 text-sm font-medium text-[#D6E0FB] transition-colors hover:border-[#5B7FE0] hover:bg-[#132663] hover:text-[#EEF2FE] disabled:cursor-wait disabled:opacity-60"
      type="button"
      onClick={signOut}
      disabled={isSubmitting}
    >
      {isSubmitting ? "Saindo…" : "Sair"}
    </button>
  );
}
