"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";

export function LoginForm() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);

    const formData = new FormData(event.currentTarget);
    const response = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: formData.get("email"),
        password: formData.get("password"),
      }),
    }).catch(() => null);

    if (!response?.ok) {
      const body = await response?.json().catch(() => null);
      setError(body?.error ?? "Não foi possível conectar. Tente novamente.");
      setIsSubmitting(false);
      return;
    }

    router.replace("/catalogo");
    router.refresh();
  }

  return (
    <form className="mt-8 flex flex-col gap-[18px]" onSubmit={handleSubmit}>
      <label className="flex flex-col gap-2 text-[12px] font-medium tracking-[0.08em] text-[#9AA3BC] uppercase">
        E-mail
        <input
          className="h-[42px] rounded-[8px] border border-[#2B3450] bg-[#0B1128] px-3 text-sm text-[#E6EAF6] placeholder:text-[#5E6884] outline-none transition-colors focus:border-[#5B7FE0]"
          type="email"
          name="email"
          autoComplete="username"
          placeholder="nome@empresa.com"
          required
        />
      </label>
      <label className="flex flex-col gap-2 text-[12px] font-medium tracking-[0.08em] text-[#9AA3BC] uppercase">
        Senha
        <input
          className="h-[42px] rounded-[8px] border border-[#2B3450] bg-[#0B1128] px-3 text-sm text-[#E6EAF6] placeholder:text-[#5E6884] outline-none transition-colors focus:border-[#5B7FE0]"
          type="password"
          name="password"
          autoComplete="current-password"
          placeholder="••••••••"
          required
        />
      </label>
      {error ? <p role="alert" className="text-sm text-[#F0A0A5]">{error}</p> : null}
      <button
        className="flex h-11 items-center justify-center gap-2 rounded-[8px] border border-[#5B7FE0] bg-transparent px-5 text-sm font-semibold text-[#D6E0FB] transition-colors hover:bg-[#132663] hover:text-[#EEF2FE] disabled:cursor-wait disabled:opacity-60"
        type="submit"
        disabled={isSubmitting}
      >
        <span>{isSubmitting ? "Entrando…" : "Entrar"}</span>
        <svg viewBox="0 0 256 256" className="h-4 w-4 fill-current" aria-hidden="true">
          <path d="M128 40a8 8 0 0 1 8 8v70h70a8 8 0 0 1 0 16h-70v70a8 8 0 0 1-16 0v-70H40a8 8 0 0 1 0-16h80V48a8 8 0 0 1 8-8Z" />
        </svg>
      </button>
    </form>
  );
}
