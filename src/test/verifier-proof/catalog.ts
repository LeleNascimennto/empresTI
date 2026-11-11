export type Equipment = {
  assetTag: string;
  conditionStatus: "AVAILABLE" | "MAINTENANCE";
};

export function listAvailableEquipment(equipment: Equipment[]) {
  return equipment.filter((item) => item.conditionStatus === "AVAILABLE");
}
