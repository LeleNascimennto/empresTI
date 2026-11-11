export type EquipmentImageItem = {
  assetTag: string;
  name: string;
  category: string;
  conditionStatus: "AVAILABLE" | "MAINTENANCE";
  query: string;
};

export const equipment: EquipmentImageItem[];
export function resizeToJpeg(input: Buffer): Promise<Buffer>;
