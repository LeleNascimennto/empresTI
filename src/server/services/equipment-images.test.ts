import sharp from "sharp";
import { describe, expect, it } from "vitest";
import { equipment, resizeToJpeg } from "../../../scripts/prepare-equipment-images.mjs";

describe("equipment image preparation", () => {
  it("includes exactly the 12 standard asset tags", () => {
    expect(equipment.map((item) => item.assetTag)).toEqual([
      "TI-0001", "TI-0002", "TI-0003", "TI-0004", "TI-0005", "TI-0006",
      "TI-0007", "TI-0008", "TI-0009", "TI-0010", "TI-0011", "TI-0012",
    ]);
  });

  it("preserves the approved categories and maintenance statuses for loading", () => {
    expect(equipment.map(({ category, conditionStatus }) => [category, conditionStatus])).toEqual([
      ["notebook", "AVAILABLE"],
      ["notebook", "AVAILABLE"],
      ["notebook", "AVAILABLE"],
      ["notebook", "MAINTENANCE"],
      ["monitor", "AVAILABLE"],
      ["monitor", "AVAILABLE"],
      ["monitor", "MAINTENANCE"],
      ["cabo", "AVAILABLE"],
      ["cabo", "AVAILABLE"],
      ["cabo", "MAINTENANCE"],
      ["camera", "AVAILABLE"],
      ["camera", "AVAILABLE"],
    ]);
  });

  it("outputs an 800 by 600 JPEG", async () => {
    const fixture = await sharp({
      create: { width: 1400, height: 900, channels: 3, background: { r: 30, g: 70, b: 130 } },
    }).png().toBuffer();
    const output = await resizeToJpeg(fixture);
    const metadata = await sharp(output).metadata();
    expect(metadata.format).toBe("jpeg");
    expect(metadata.width).toBe(800);
    expect(metadata.height).toBe(600);
  });
});
