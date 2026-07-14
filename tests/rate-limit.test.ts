import { describe, expect, it } from "vitest";
import { checkRateLimit } from "@/lib/rate-limit";

describe("checkRateLimit", () => {
  it("bloqueia ao atingir o limite e isola chaves", () => {
    const key = `test:${Math.random()}`;
    expect(checkRateLimit(key, 2, 60_000)).toBe(true);
    expect(checkRateLimit(key, 2, 60_000)).toBe(true);
    expect(checkRateLimit(key, 2, 60_000)).toBe(false);
    expect(checkRateLimit(`${key}:other`, 2, 60_000)).toBe(true);
  });
});
