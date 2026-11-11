"use client";

import { trpc } from "../trpc/client";
import Image, { type ImageLoaderProps } from "next/image";

function publicStorageImageLoader({ src }: ImageLoaderProps) {
  return src;
}

function formatDate(date: Date | null) {
  if (!date) return "—";
  const parts = new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "short",
    timeZone: "America/Sao_Paulo",
  }).formatToParts(date);
  const day = parts.find((part) => part.type === "day")?.value ?? "";
  const month = parts.find((part) => part.type === "month")?.value.replace(".", "") ?? "";
  return `${day}/${month}`;
}

function formatPickupDeadline(date: Date | null) {
  if (!date) return "";
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "America/Sao_Paulo",
  }).format(date).replace(" de ", "/").replace(".", "");
}

export function MyLoans() {
  const loans = trpc.loans.mine.useQuery(undefined, { refetchInterval: 60_000 });
  const utils = trpc.useUtils();
  const refresh = async () => Promise.all([
    utils.loans.mine.invalidate(),
    utils.equipment.listCatalog.invalidate(),
  ]);
  const confirmPickup = trpc.loans.confirmPickup.useMutation({ onSuccess: refresh });
  const cancelPending = trpc.loans.cancelPending.useMutation({ onSuccess: refresh });
  const mutationError = confirmPickup.error ?? cancelPending.error;

  if (loans.isLoading) {
    return (
      <section className="flex flex-col gap-4" aria-label="Carregando empréstimos">
        <div className="h-8 w-60 animate-pulse rounded bg-[#0E1530]" />
        {Array.from({ length: 3 }, (_, index) => <div key={index} className="h-32 animate-pulse rounded-xl border border-[#1F2949] bg-[#0B1128]" />)}
      </section>
    );
  }

  if (loans.error) {
    return (
      <section className="flex min-h-64 flex-col items-start justify-center gap-4 rounded-xl border border-[#1F2949] bg-[#0E1530] p-6">
        <h1 className="text-2xl font-semibold">Meus empréstimos</h1>
        <p className="text-sm text-[#9AA3BC]">Não foi possível carregar seus pedidos.</p>
        <button className="rounded-lg border border-[#5B7FE0] px-4 py-2 text-sm text-[#B4C6F6]" onClick={() => void loans.refetch()}>Tentar novamente</button>
      </section>
    );
  }

  const items = loans.data?.items ?? [];
  const activeCount = loans.data?.activeCount ?? 0;

  return (
    <section className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <p className="text-[11px] uppercase tracking-[0.12em] text-[#8AA6EE]">Acompanhamento</p>
        <h1 className="text-2xl font-semibold text-[#E6EAF6]">Meus empréstimos</h1>
        <p className="text-sm text-[#9AA3BC]">Pedidos pendentes também contam no limite de 5 itens.</p>
      </div>

      <p className="w-fit rounded-lg border border-[#2B3450] bg-[#0B1128] px-3 py-2 text-sm text-[#C2CAE0]">{activeCount} de 5 itens</p>
      {loans.data?.hasOverdueLoan && <p role="status" className="rounded-lg border border-[#6B4A2C] bg-[#2D1E12] px-4 py-3 text-sm text-[#E2B47D]">Você tem um item em atraso. Novas solicitações estão bloqueadas.</p>}

      {mutationError && <p role="alert" className="rounded-lg border border-[#7D3844] bg-[#32171E] px-4 py-3 text-sm text-[#F2A7B2]">{mutationError.message}</p>}

      {items.length === 0 ? (
        <div className="rounded-xl border border-[#1F2949] bg-[#0E1530] p-6 text-sm text-[#9AA3BC]">Nenhum pedido em aberto.</div>
      ) : (
        <div className="flex flex-col gap-3">
          {items.map((loan) => {
            const pending = !loan.checkedOutAt;
            const pendingWorking = confirmPickup.isPending || cancelPending.isPending;
            const overdue = loan.isOverdue;
            const progress = loan.progressPercent;

            return (
              <article key={loan.id} className="flex flex-col gap-4 rounded-xl border border-[#1F2949] bg-[#0E1530] p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5">
                <div className="flex min-w-0 items-center gap-4">
                  <div className="relative h-16 w-20 shrink-0 overflow-hidden rounded-lg bg-[#0B1128]">
                    {loan.equipment.imageUrl ? <Image src={loan.equipment.imageUrl} alt="" fill sizes="80px" loader={publicStorageImageLoader} unoptimized className="object-cover" /> : <div className="h-full w-full" />}
                  </div>
                  <div className="min-w-0">
                    <p className="text-[11px] uppercase tracking-[0.1em] text-[#7C86A2]">{loan.equipment.assetTag} · {loan.equipment.category}</p>
                    <h2 className="truncate font-semibold text-[#E6EAF6]">{loan.equipment.name}</h2>
                    {pending ? (
                      <p className="mt-1 text-sm text-[#9AA3BC]">Aguardando retirada · até {formatPickupDeadline(loan.expiresAt)}</p>
                    ) : (
                      <p className={`mt-1 text-sm ${overdue ? "text-[#F2A7B2]" : "text-[#9AA3BC]"}`}>
                        {overdue ? "Atrasado" : "Devolver até"} {formatDate(loan.dueAt)}
                      </p>
                    )}
                  </div>
                </div>

                {pending ? (
                  <div className="flex flex-col gap-2 sm:w-[220px]">
                    <button
                      type="button"
                      disabled={pendingWorking}
                      onClick={() => confirmPickup.mutate({ loanId: loan.id })}
                      className="rounded-lg border border-[#5B7FE0] px-4 py-2 text-sm text-[#B4C6F6] transition-colors hover:bg-[#132663] disabled:opacity-50"
                    >{confirmPickup.isPending && confirmPickup.variables?.loanId === loan.id ? "Confirmando…" : "Confirmar retirada"}</button>
                    <button
                      type="button"
                      disabled={pendingWorking}
                      onClick={() => cancelPending.mutate({ loanId: loan.id })}
                      className="rounded-lg border border-[#2B3450] px-4 py-2 text-sm text-[#9AA3BC] hover:bg-[#0B1128] disabled:opacity-50"
                    >{cancelPending.isPending && cancelPending.variables?.loanId === loan.id ? "Cancelando…" : "Cancelar pedido"}</button>
                  </div>
                ) : (
                  <div className="flex w-full flex-col gap-2 sm:w-[220px]">
                    <div className="flex items-center justify-between text-[11px] text-[#7C86A2]"><span>Prazo</span><span>{formatDate(loan.checkedOutAt)} — {formatDate(loan.dueAt)}</span></div>
                    <div className="h-1.5 overflow-hidden rounded-full bg-[#0B1128]" role="progressbar" aria-label="Prazo do empréstimo" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(progress)}>
                      <div className={`h-full rounded-full ${overdue ? "bg-[#D36F7E]" : "bg-[#5B7FE0]"}`} style={{ width: `${progress}%` }} />
                    </div>
                  </div>
                )}
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}
