"use client";

import { useState, type FormEvent } from "react";

const items = [
  ["TI-0001", "Notebook 14 polegadas", "notebook", false],
  ["TI-0002", "Notebook 15 polegadas", "notebook", false],
  ["TI-0003", "Notebook 13 polegadas", "notebook", false],
  ["TI-0004", "Notebook 15 polegadas", "notebook", true],
  ["TI-0005", "Monitor 24 polegadas", "monitor", false],
  ["TI-0006", "Monitor 27 polegadas", "monitor", false],
  ["TI-0007", "Monitor 22 polegadas", "monitor", true],
  ["TI-0008", "Cabo HDMI 2 m", "cabo", false],
  ["TI-0009", "Cabo USB-C 1 m", "cabo", false],
  ["TI-0010", "Cabo de rede 3 m", "cabo", true],
  ["TI-0011", "Webcam Full HD", "câmera", false],
  ["TI-0012", "Câmera compacta", "câmera", false],
] as const;

type LoanState = "pending" | "active";

export default function DemoPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [entered, setEntered] = useState(false);
  const [error, setError] = useState("");
  const [loans, setLoans] = useState<Record<string, LoanState>>({});
  const activeCount = Object.keys(loans).length;

  function login(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!/^[a-z]+\.[a-z]+@institutojef\.org\.br$/i.test(email.trim()) || password !== "inovação2026") {
      setError("Confira o e-mail institucional e a senha de demonstração.");
      return;
    }
    setError("");
    setPassword("");
    setEntered(true);
  }

  if (!entered) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#080C1A] p-5 text-[#E6EAF6]">
        <form onSubmit={login} className="flex w-full max-w-md flex-col gap-5 rounded-2xl border border-[#25408F] bg-[#0E1530] p-8">
          <span className="text-xs uppercase tracking-[0.14em] text-[#9AA3BC]">EmpresTI · demonstração</span>
          <h1 className="text-2xl font-semibold">Acessar demonstração</h1>
          <p className="text-sm text-[#9AA3BC]">Esta área usa dados fictícios. Nenhuma solicitação será salva no Supabase.</p>
          <label className="flex flex-col gap-2 text-sm">E-mail institucional
            <input className="rounded-lg border border-[#2B3450] bg-[#080C1A] p-3 outline-none focus:border-[#5B7FE0]" type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="nome.sobrenome@institutojef.org.br" required />
          </label>
          <label className="flex flex-col gap-2 text-sm">Senha de demonstração
            <input className="rounded-lg border border-[#2B3450] bg-[#080C1A] p-3 outline-none focus:border-[#5B7FE0]" type="password" value={password} onChange={(event) => setPassword(event.target.value)} required />
          </label>
          {error && <p role="alert" className="text-sm text-[#E5A6A6]">{error}</p>}
          <button className="rounded-lg border border-[#5B7FE0] px-5 py-3 text-[#B4C6F6] hover:bg-[#132663]" type="submit">Entrar</button>
        </form>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#080C1A] p-5 text-[#E6EAF6] sm:p-8">
      <div className="mx-auto flex max-w-6xl flex-col gap-8">
        <header className="flex flex-wrap items-center justify-between gap-4 border-b border-[#25408F] pb-5">
          <div><p className="text-xs uppercase tracking-[0.14em] text-[#9AA3BC]">EmpresTI · dados fictícios</p><h1 className="text-3xl font-semibold">Catálogo de equipamentos</h1></div>
          <button className="rounded-lg border border-[#5B7FE0] px-4 py-2 text-sm text-[#B4C6F6]" onClick={() => { setEntered(false); setLoans({}); }} type="button">Sair</button>
        </header>
        <p className="rounded-lg border border-[#25408F] bg-[#0E1530] p-4 text-sm text-[#B4C6F6]">Demonstração local: os pedidos não são enviados ao banco e desaparecem ao recarregar a página.</p>
        <section className="flex flex-col gap-4" aria-labelledby="my-loans-title">
          <h2 id="my-loans-title" className="text-xl font-semibold">Meus empréstimos · {activeCount} de 5 itens</h2>
          {activeCount === 0 ? <p className="text-sm text-[#9AA3BC]">Nenhum pedido em aberto.</p> : (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {Object.entries(loans).map(([tag, state]) => {
                const item = items.find(([assetTag]) => assetTag === tag);
                return <article key={tag} className="flex flex-col gap-3 rounded-xl border border-[#2B3450] bg-[#0E1530] p-4">
                  <strong>{item?.[1]}</strong><span className="text-sm text-[#9AA3BC]">{tag} · {state === "pending" ? "Aguardando retirada" : "Emprestado"}</span>
                  <div className="flex flex-wrap gap-2">
                    {state === "pending" && <button className="rounded-lg border border-[#5B7FE0] px-3 py-2 text-sm text-[#B4C6F6]" onClick={() => setLoans((current) => ({ ...current, [tag]: "active" }))} type="button">Confirmar retirada</button>}
                    <button className="rounded-lg border border-[#5B7FE0] px-3 py-2 text-sm text-[#B4C6F6]" onClick={() => setLoans((current) => { const next = { ...current }; delete next[tag]; return next; })} type="button">{state === "pending" ? "Cancelar pedido" : "Devolver item"}</button>
                  </div>
                </article>;
              })}
            </div>
          )}
        </section>
        <section className="flex flex-col gap-4" aria-labelledby="catalog-title">
          <h2 id="catalog-title" className="text-xl font-semibold">Equipamentos</h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {items.map(([tag, name, category, maintenance]) => {
              const state = loans[tag];
              const available = !maintenance && !state;
              return <article key={tag} className="flex flex-col gap-4 rounded-xl border border-[#2B3450] bg-[#0E1530] p-5">
                <div className="flex h-28 items-center justify-center rounded-lg bg-[#080C1A] text-xs text-[#7280A5]">Imagem em preparação</div>
                <div><p className="text-xs uppercase tracking-wider text-[#9AA3BC]">{tag} · {category}</p><h3 className="mt-1 text-lg font-semibold">{name}</h3></div>
                <span className="text-sm text-[#9AA3BC]">{maintenance ? "Manutenção" : state === "pending" ? "Aguardando retirada" : state === "active" ? "Emprestado" : "Disponível"}</span>
                {available && <button className="rounded-lg border border-[#5B7FE0] px-4 py-2 text-sm text-[#B4C6F6] disabled:opacity-50" disabled={activeCount >= 5} onClick={() => setLoans((current) => ({ ...current, [tag]: "pending" }))} type="button">{activeCount >= 5 ? "Limite de 5 itens" : "Solicitar empréstimo"}</button>}
              </article>;
            })}
          </div>
        </section>
      </div>
    </main>
  );
}
