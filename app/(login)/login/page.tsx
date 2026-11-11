import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { LoginForm } from "@/components/login-form";

export default async function LoginPage() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();

  if (data?.claims?.sub) {
    redirect("/catalogo");
  }

  return (
    <main className="grid min-h-screen bg-[#080C1A] text-[#E6EAF6] lg:grid-cols-[560px_1fr]" data-screen-label="01 Login">
      <section className="flex flex-col justify-between gap-12 bg-[linear-gradient(160deg,#001449_0%,#00102F_60%,#080C1A_100%)] p-8 sm:p-14">
        <div className="flex items-center gap-3 text-[#E6EAF6]">
          <span className="flex h-9 w-9 items-center justify-center rounded-[8px] border border-[#25408F] bg-[#0E1530] text-[#B4C6F6] shadow-[0_0_0_1px_#25408F]">
            <svg viewBox="0 0 256 256" className="h-4 w-4 fill-current" aria-hidden="true">
              <path d="M128 24c57.6 0 104 46.4 104 104s-46.4 104-104 104S24 185.6 24 128 70.4 24 128 24Zm-8 48h16v64h48v16h-64V72Z" />
            </svg>
          </span>
          <span className="text-base font-semibold tracking-[0.02em]">EmpresTI</span>
        </div>

        <div className="flex max-w-[420px] flex-col gap-7">
          <div className="flex flex-col gap-3">
            <h1 className="max-w-[20ch] text-[34px] font-semibold leading-[1.15] text-[#E6EAF6] tracking-[-0.01em]">
              Controle de equipamentos, sem planilha.
            </h1>
            <p className="max-w-[38ch] text-sm leading-6 text-[#93A0C6]">
              Solicite, acompanhe e devolva equipamentos internos com regras claras e visíveis.
            </p>
          </div>

          <div className="flex gap-10 border-t border-[#5B7FE0]/30 pt-6">
            <p className="flex flex-col gap-1 text-xs text-[#9AA3BC]">
              <strong className="text-[24px] font-semibold text-[#E6EAF6]">5 itens</strong>
              por pessoa
            </p>
            <p className="flex flex-col gap-1 text-xs text-[#9AA3BC]">
              <strong className="text-[24px] font-semibold text-[#E6EAF6]">14 dias úteis</strong>
              de prazo
            </p>
          </div>
        </div>

        <p className="text-[11px] uppercase tracking-[0.12em] text-[#7280A5]">Operações · v1</p>
      </section>

      <section className="flex items-center justify-center p-6 sm:p-14">
        <div className="w-full max-w-[372px]">
          <h2 className="text-[22px] font-semibold text-[#E6EAF6]">Entrar</h2>
          <p className="mt-2 text-sm text-[#9AA3BC]">Use o e-mail e a senha da sua conta.</p>
          <LoginForm />
          <p className="mt-6 text-center text-[11px] uppercase tracking-[0.08em] text-[#7280A5]">
            Acesso disponível somente por convite de administrador.
          </p>
        </div>
      </section>
    </main>
  );
}
