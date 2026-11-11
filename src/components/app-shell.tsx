import type { ReactNode } from "react";
import Link from "next/link";
import { SignOutButton } from "@/components/sign-out-button";

const navItems = [
  {
    href: "/catalogo",
    label: "Catálogo",
    icon: (
      <svg viewBox="0 0 256 256" className="h-4 w-4 fill-current" aria-hidden="true">
        <path d="M72 40h112a16 16 0 0 1 16 16v144a16 16 0 0 1-16 16H72a16 16 0 0 1-16-16V56a16 16 0 0 1 16-16Zm-8 40h128v16H64V80Zm0 32h128v16H64v-16Zm0 32h80v16H64v-16Z" />
      </svg>
    ),
  },
  {
    href: "/meus-emprestimos",
    label: "Meus empréstimos",
    icon: (
      <svg viewBox="0 0 256 256" className="h-4 w-4 fill-current" aria-hidden="true">
        <path d="M128 32a96 96 0 1 0 96 96 96.11 96.11 0 0 0-96-96Zm40.49 116.49-40 40a12 12 0 0 1-17 0l-24-24a12 12 0 1 1 17-17l15.51 15.5L151.51 132a12 12 0 1 1 17 17Z" />
      </svg>
    ),
  },
  {
    href: "/operacoes/emprestimos",
    label: "Operações",
    icon: (
      <svg viewBox="0 0 256 256" className="h-4 w-4 fill-current" aria-hidden="true">
        <path d="M40 56a16 16 0 0 1 16-16h144a16 16 0 0 1 16 16v16a16 16 0 0 1-16 16H56A16 16 0 0 1 40 72V56Zm16 72h96v16H56v-16Zm0 40h144v16H56v-16Zm0 40h80v16H56v-16Z" />
      </svg>
    ),
  },
  {
    href: "/operacoes/equipamentos/novo",
    label: "Cadastrar equipamento",
    icon: (
      <svg viewBox="0 0 256 256" className="h-4 w-4 fill-current" aria-hidden="true">
        <path d="M128 24a104 104 0 1 0 104 104A104.11 104.11 0 0 0 128 24Zm48 112h-40v40a8 8 0 0 1-16 0v-40H80a8 8 0 0 1 0-16h40V80a8 8 0 0 1 16 0v40h40a8 8 0 0 1 0 16Z" />
      </svg>
    ),
  },
];

function BrandMark() {
  return (
    <div className="flex items-center gap-3 rounded-[8px] border border-[#25408F] bg-[#001449] px-2 py-2 shadow-[0_0_0_1px_#25408F]">
      <span className="flex h-7 w-7 items-center justify-center rounded-[7px] bg-[#0E1530] text-[#B4C6F6]" aria-hidden="true">
        <svg viewBox="0 0 256 256" className="h-4 w-4 fill-current" aria-hidden="true">
          <path d="M128 24c57.6 0 104 46.4 104 104s-46.4 104-104 104S24 185.6 24 128 70.4 24 128 24Zm-8 48h16v64h48v16h-64V72Z" />
        </svg>
      </span>
      <span className="text-[14px] font-semibold tracking-[0.02em] text-[#E6EAF6]">EmpresTI</span>
    </div>
  );
}

export function AppShell({ email, children }: { email: string; children: ReactNode }) {
  return (
    <div className="min-h-screen bg-[#080C1A] text-[#E6EAF6]">
      <div className="mx-auto flex min-h-screen max-w-[1440px]">
        <aside className="w-[236px] shrink-0 border-r border-[#1A2340] bg-[#060A16] p-[22px_14px]">
          <div className="flex flex-col gap-8">
            <BrandMark />

            <nav className="flex flex-col gap-1" aria-label="Navegação principal">
              {navItems.map(({ href, label, icon }) => {
                const isActive = href === "/catalogo";
                return (
                  <Link
                    key={href}
                    href={href}
                    className={[
                      "flex items-center gap-3 rounded-[8px] px-[10px] py-[9px] text-[13px] transition-colors",
                      isActive
                        ? "bg-[#132663] text-[#E6EAF6] shadow-[0_0_0_1px_#25408F]"
                        : "text-[#9AA3BC] hover:bg-[#0E1530] hover:text-[#E6EAF6]",
                    ].join(" ")}
                  >
                    <span className="flex h-4 w-4 items-center justify-center">{icon}</span>
                    <span>{label}</span>
                  </Link>
                );
              })}
            </nav>

            <div className="mt-auto rounded-[12px] border border-[#1F2949] bg-[#0E1530] p-3">
              <div className="flex items-center gap-3">
                <span className="flex h-9 w-9 items-center justify-center rounded-[10px] bg-[#132663] text-[#D6E0FB]">
                  <svg viewBox="0 0 256 256" className="h-[18px] w-[18px] fill-current" aria-hidden="true">
                    <path d="M128 24a104 104 0 1 0 104 104A104.12 104.12 0 0 0 128 24Zm0 40a36 36 0 1 1-36 36 36 36 0 0 1 36-36Zm0 144c-28.4 0-53.57-14.41-68-36.25C68.52 142.76 92.48 128 128 128s59.48 14.76 68 43.75C181.57 193.59 156.4 208 128 208Z" />
                  </svg>
                </span>
                <div className="min-w-0">
                  <div className="text-[11px] uppercase tracking-[0.12em] text-[#5E6884]">Conta</div>
                  <div className="truncate text-[12px] text-[#E6EAF6]">{email}</div>
                </div>
              </div>
            </div>
          </div>
        </aside>

        <div className="flex min-h-screen flex-1 flex-col">
          <header className="flex items-center justify-between border-b border-[#1A2340] bg-[#080C1A]/80 px-6 py-4 backdrop-blur-sm">
            <div className="flex items-center gap-3 text-[#9AA3BC]">
              <span className="inline-flex h-7 w-7 items-center justify-center rounded-[8px] border border-[#2B3450] bg-[#0B1128] text-[#8AA6EE]">
                <svg viewBox="0 0 256 256" className="h-4 w-4 fill-current" aria-hidden="true">
                  <path d="M128 24c57.6 0 104 46.4 104 104s-46.4 104-104 104S24 185.6 24 128 70.4 24 128 24ZM80 108h96v16H80v-16Zm0 32h96v16H80v-16Z" />
                </svg>
              </span>
              <span className="text-[12px] uppercase tracking-[0.12em]">Operações</span>
            </div>

            <div className="flex items-center gap-3">
              <button
                type="button"
                className="inline-flex h-9 w-9 items-center justify-center rounded-[8px] border border-[#2B3450] bg-[#0B1128] text-[#8AA6EE] transition-colors hover:border-[#5B7FE0] hover:text-[#B4C6F6]"
                aria-label="Notificações"
              >
                <svg viewBox="0 0 256 256" className="h-[16px] w-[16px] fill-current" aria-hidden="true">
                  <path d="M128 32a80 80 0 0 0-80 80v40l-18 24h196l-18-24V112a80 80 0 0 0-80-80Zm0 192a32 32 0 0 1-30.95-24h61.9A32 32 0 0 1 128 224Z" />
                </svg>
              </button>
              <SignOutButton />
            </div>
          </header>

          <main className="flex-1 p-6 sm:p-8 lg:p-10">
            <div className="mx-auto w-full max-w-[1120px]">{children}</div>
          </main>
        </div>
      </div>
    </div>
  );
}
