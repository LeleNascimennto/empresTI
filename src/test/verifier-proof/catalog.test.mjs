import assert from "node:assert/strict";
import test from "node:test";
import { listAvailableEquipment } from "./catalog.ts";

const equipment = [
  { assetTag: "TI-0001", conditionStatus: "AVAILABLE" },
  { assetTag: "TI-0002", conditionStatus: "MAINTENANCE" },
];

test("CA-01: lista somente equipamentos disponíveis", () => {
  assert.deepEqual(
    listAvailableEquipment(equipment).map((item) => item.assetTag),
    ["TI-0001"],
  );
});

test("CA-02: oculta equipamentos em manutenção", () => {
  assert.equal(
    listAvailableEquipment(equipment).some((item) => item.conditionStatus === "MAINTENANCE"),
    false,
  );
});
