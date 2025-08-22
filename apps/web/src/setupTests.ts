import { vi } from "vitest";

// next/image を自動モック
vi.mock("next/image", async () => {
  const mod = await import("./__mocks__/next/image");
  return { default: mod.default };
});
