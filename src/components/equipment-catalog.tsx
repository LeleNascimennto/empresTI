"use client";

import { trpc } from "../trpc/client";
import Image, { type ImageLoaderProps } from "next/image";

function publicStorageImageLoader({ src }: ImageLoaderProps) {
  return src;
}

const statusLabels: Record<string, string> = {
  AVAILABLE: "Disponível",
  BORROWED: "Emprestado",
  PENDING_PICKUP: "Aguardando retirada",
  MAINTENANCE: "Manutenção",
};

const statusClasses: Record<string, string> = {
  AVAILABLE: "border-[#285D49] bg-[#0E2A22] text-[#79D6A5]",
  BORROWED: "border-[#2B3450] bg-[#0B1128] text-[#9AA3BC]",
  PENDING_PICKUP: "border-[#2B3450] bg-[#0B1128] text-[#9AA3BC]",
  MAINTENANCE: "border-[#6B4A2C] bg-[#2D1E12] text-[#E2B47D]",
};

function formatDate(date: Date | null) {
  if (!date) return "";
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "America/Sao_Paulo",
  }).format(date).replace(" de ", "/").replace(".", "");
}

export function EquipmentCatalog() {
  const catalog = trpc.equipment.listCatalog.useQuery(undefined, { refetchInterval: 60_000 });
  const utils = trpc.useUtils();
  const request = trpc.loans.request.useMutation({
    onSuccess: async () => {
      await Promise.all([
        utils.equipment.listCatalog.invalidate(),
        utils.loans.mine.invalidate(),
      ]);
    },
  });

  if (catalog.isLoading) {
    return (
      <section className="flex flex-col gap-6" aria-label="Carregando catálogo">
        <div className="h-9 w-52 animate-pulse rounded bg-[#0E1530]" />
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }, (_, index) => <div key={index} className="h-[330px] animate-pulse rounded-xl border border-[#1F2949] bg-[#0B1128]" />)}
        </div>
      </section>
    );
  }

  if (catalog.error) {
    return (
      <section className="flex min-h-64 flex-col items-start justify-center gap-4 rounded-xl border border-[#1F2949] bg-[#0E1530] p-6">
        <h1 className="text-2xl font-semibold">Catálogo</h1>
        <p className="text-sm text-[#9AA3BC]">Não foi possível carregar os equipamentos.</p>
        <button className="rounded-lg border border-[#5B7FE0] px-4 py-2 text-sm text-[#B4C6F6]" onClick={() => void catalog.refetch()}>Tentar novamente</button>
      </section>
    );
  }

  const equipment = catalog.data ?? [];
  const activeCount = equipment[0]?.activeCount ?? 0;
  const hasOverdueLoan = equipment[0]?.hasOverdueLoan ?? false;

  return (
    <section className="flex flex-col gap-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="flex flex-col gap-2">
          <p className="text-[11px] uppercase tracking-[0.12em] text-[#8AA6EE]">Equipamentos</p>
          <h1 className="text-2xl font-semibold text-[#E6EAF6]">Catálogo</h1>
          <p className="text-sm text-[#9AA3BC]">Solicite um item disponível e confirme a retirada em Meus empréstimos.</p>
        </div>
        <p className="rounded-lg border border-[#2B3450] bg-[#0B1128] px-3 py-2 text-sm text-[#C2CAE0]">{activeCount} de 5 itens</p>
      </div>

      {hasOverdueLoan && <p role="status" className="rounded-lg border border-[#6B4A2C] bg-[#2D1E12] px-4 py-3 text-sm text-[#E2B47D]">Você tem um item em atraso. Regularize a devolução antes de solicitar outro.</p>}
      {request.error && <p role="alert" className="rounded-lg border border-[#7D3844] bg-[#32171E] px-4 py-3 text-sm text-[#F2A7B2]">{request.error.message}</p>}

      {equipment.length === 0 ? (
        <div className="rounded-xl border border-[#1F2949] bg-[#0E1530] p-6 text-sm text-[#9AA3BC]">Nenhum equipamento cadastrado.</div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {equipment.map((item) => (
            <article key={item.id} className="overflow-hidden rounded-xl border border-[#1F2949] bg-[#0E1530]">
              <div className="relative aspect-[4/3] bg-[#0B1128]">
                {item.imageUrl ? <Image src={item.imageUrl} alt={item.name} fill sizes="(max-width: 640px) 100vw, (max-width: 1280px) 50vw, 33vw" loader={publicStorageImageLoader} unoptimized className="object-cover" /> : <div className="flex h-full items-center justify-center text-xs text-[#5E6884]">Imagem indisponível</div>}
              </div>
              <div className="flex flex-col gap-4 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-[11px] uppercase tracking-[0.1em] text-[#7C86A2]">{item.assetTag} · {item.category}</p>
                    <h2 className="mt-1 font-semibold text-[#E6EAF6]">{item.name}</h2>
                  </div>
                  <span className={`shrink-0 rounded-full border px-2.5 py-1 text-[11px] ${statusClasses[item.status]}`}>{statusLabels[item.status]}</span>
                </div>
                {item.status === "PENDING_PICKUP" && <p className="text-xs text-[#9AA3BC]">Retirada até {formatDate(item.pickupExpiresAt)}.</p>}
                {item.status === "AVAILABLE" && (
                  <button
                    type="button"
                    disabled={!item.canRequest || request.isPending}
                    onClick={() => request.mutate({ equipmentId: item.id })}
                    aria-describedby={!item.canRequest ? `request-block-${item.id}` : undefined}
                    className="w-full rounded-lg border border-[#5B7FE0] px-4 py-2 text-sm text-[#B4C6F6] transition-colors hover:bg-[#132663] disabled:cursor-not-allowed disabled:border-[#2B3450] disabled:text-[#5E6884]"
                  >
                    {request.isPending && request.variables?.equipmentId === item.id
                      ? "Solicitando…"
                      : item.canRequest
                        ? "Solicitar empréstimo"
                        : hasOverdueLoan
                          ? "Solicitação bloqueada por atraso"
                          : "Limite de 5 itens atingido"}
                  </button>
                )}
                {item.status === "AVAILABLE" && !item.canRequest && !hasOverdueLoan && (
                  <p id={`request-block-${item.id}`} className="text-xs text-[#9AA3BC]">Devolva um item para liberar uma nova solicitação.</p>
                )}
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
