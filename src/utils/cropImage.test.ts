import { describe, expect, it } from "vitest";
import { CROP_PRESETS } from "./cropImage";

describe("cropImage presets", () => {
  it("mantém a proporção declarada", () => {
    for (const preset of Object.values(CROP_PRESETS)) {
      expect(preset.width / preset.height).toBeCloseTo(preset.aspect);
    }
  });
});
