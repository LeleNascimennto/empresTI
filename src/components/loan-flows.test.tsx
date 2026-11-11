import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { EquipmentCatalog } from "./equipment-catalog";
import { MyLoans } from "./my-loans";

const mocks = vi.hoisted(() => ({
  catalogQuery: vi.fn(),
  loansQuery: vi.fn(),
  requestMutation: vi.fn(),
  confirmMutation: vi.fn(),
  cancelMutation: vi.fn(),
  useUtils: vi.fn(),
  invalidate: vi.fn(),
}));

vi.mock("../trpc/client", () => ({
  trpc: {
    equipment: { listCatalog: { useQuery: mocks.catalogQuery } },
    loans: {
      mine: { useQuery: mocks.loansQuery },
      request: { useMutation: mocks.requestMutation },
      confirmPickup: { useMutation: mocks.confirmMutation },
      cancelPending: { useMutation: mocks.cancelMutation },
    },
    useUtils: mocks.useUtils,
  },
}));

const equipment = {
  id: "11111111-1111-4111-8111-111111111111",
  assetTag: "TI-0001",
  name: "Notebook 14 polegadas",
  category: "notebook",
  imageUrl: null,
  status: "AVAILABLE",
  pickupExpiresAt: null,
  canRequest: true,
  activeCount: 1,
  hasOverdueLoan: false,
};

const pendingLoan = {
  id: "22222222-2222-4222-8222-222222222222",
  checkedOutAt: null,
  dueAt: null,
  expiresAt: new Date("2026-11-17T18:30:00.000Z"),
  equipment: {
    id: equipment.id,
    assetTag: "TI-0001",
    name: equipment.name,
    category: "notebook",
    imageUrl: null,
  },
};

function mutationResult(mutate = vi.fn()) {
  return { mutate, isPending: false, error: null, variables: undefined };
}

function setupUtils() {
  const invalidate = mocks.invalidate;
  return {
    equipment: { listCatalog: { invalidate } },
    loans: { mine: { invalidate } },
  };
}

beforeEach(() => {
  mocks.catalogQuery.mockReset();
  mocks.loansQuery.mockReset();
  mocks.requestMutation.mockReset();
  mocks.confirmMutation.mockReset();
  mocks.cancelMutation.mockReset();
  mocks.invalidate.mockReset();
  mocks.useUtils.mockReturnValue(setupUtils());
  mocks.requestMutation.mockReturnValue(mutationResult());
  mocks.confirmMutation.mockReturnValue(mutationResult());
  mocks.cancelMutation.mockReturnValue(mutationResult());
});

afterEach(() => cleanup());

describe("equipment catalog interactions", () => {
  it("shows the combined limit and submits an available equipment request", async () => {
    const user = userEvent.setup();
    const mutate = vi.fn();
    mocks.catalogQuery.mockReturnValue({ isLoading: false, error: null, data: [equipment], refetch: vi.fn() });
    mocks.requestMutation.mockReturnValue(mutationResult(mutate));

    render(<EquipmentCatalog />);
    expect(screen.getByText("1 de 5 itens")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Solicitar empréstimo" }));
    expect(mutate).toHaveBeenCalledWith({ equipmentId: equipment.id });
  });

  it("does not show a request action for an item under maintenance or awaiting pickup", () => {
    mocks.catalogQuery.mockReturnValue({
      isLoading: false,
      error: null,
      data: [
        { ...equipment, id: "33333333-3333-4333-8333-333333333333", status: "MAINTENANCE", canRequest: false },
        { ...equipment, id: "44444444-4444-4444-8444-444444444444", assetTag: "TI-0002", status: "PENDING_PICKUP", canRequest: false, pickupExpiresAt: new Date("2026-11-17T18:30:00.000Z") },
      ],
      refetch: vi.fn(),
    });
    render(<EquipmentCatalog />);
    expect(screen.getByText("Manutenção")).toBeInTheDocument();
    expect(screen.getByText("Aguardando retirada")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Solicitar empréstimo|Limite de 5 itens/ })).not.toBeInTheDocument();
  });
});

describe("my loans interactions", () => {
  it("lets the owner confirm pickup or cancel a pending request", async () => {
    const user = userEvent.setup();
    const confirm = vi.fn();
    const cancel = vi.fn();
    mocks.loansQuery.mockReturnValue({ isLoading: false, error: null, data: { items: [pendingLoan], activeCount: 1, hasOverdueLoan: false }, refetch: vi.fn() });
    mocks.confirmMutation.mockReturnValue(mutationResult(confirm));
    mocks.cancelMutation.mockReturnValue(mutationResult(cancel));

    render(<MyLoans />);
    expect(screen.getByText(/Aguardando retirada/)).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Confirmar retirada" }));
    await user.click(screen.getByRole("button", { name: "Cancelar pedido" }));
    expect(confirm).toHaveBeenCalledWith({ loanId: pendingLoan.id });
    expect(cancel).toHaveBeenCalledWith({ loanId: pendingLoan.id });
  });

  it("shows the due date and overdue state for an active loan", () => {
    mocks.loansQuery.mockReturnValue({
      isLoading: false,
      error: null,
      data: {
        items: [{
          ...pendingLoan,
          checkedOutAt: new Date("2026-10-01T12:00:00.000Z"),
          dueAt: new Date("2026-10-20T12:00:00.000Z"),
          expiresAt: null,
          isOverdue: true,
          progressPercent: 100,
        }],
        activeCount: 1,
        hasOverdueLoan: true,
      },
      refetch: vi.fn(),
    });

    render(<MyLoans />);
    expect(screen.getByText(/Atrasado/)).toBeInTheDocument();
    expect(screen.getByRole("progressbar")).toHaveAttribute("aria-valuenow", "100");
  });
});
