import { assertEquals } from "https://deno.land/std@0.189.0/testing/asserts.ts";
import { countPaths } from "./count_paths.ts";

Deno.test("grid", () => {
  const n = countPaths({
    start: [0, 0],
    successors: ([x, y]) =>
      [
        [x + 1, y],
        [x, y + 1],
      ].filter(([x, y]) => x < 8 && y < 8),
    success: ([x, y]) => x === 7 && y === 7,
  });
  assertEquals(n, 3432);
});
