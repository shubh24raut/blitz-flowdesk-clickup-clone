import { describe, expect, it } from "vitest";
import { cn, initials } from "./utils";

describe("cn", () => {
  it("merges conflicting Tailwind classes, keeping the last", () => {
    expect(cn("px-2 py-1", false && "hidden", "px-4")).toBe("py-1 px-4");
  });
});

describe("initials", () => {
  it("uses the first letters of the first two words", () => {
    expect(initials("Ada Lovelace King")).toBe("AL");
  });

  it("falls back to ? for blank names", () => {
    expect(initials("   ")).toBe("?");
  });
});
