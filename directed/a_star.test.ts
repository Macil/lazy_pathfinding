import { assertEquals } from "https://deno.land/std@0.168.0/testing/asserts.ts";
import { aStar } from "./a_star.ts";

Deno.test("aStar() doc example", () => {
  type Pos = [number, number];

  function distance(a: Pos, b: Pos): number {
    return Math.abs(a[0] - b[0]) + Math.abs(a[1] - b[1]);
  }

  const goal: Pos = [4, 6];

  const result = aStar<Pos>({
    start: [1, 1],
    successors: ([x, y]) =>
      ([
        [x + 1, y + 2],
        [x + 1, y - 2],
        [x - 1, y + 2],
        [x - 1, y - 2],
        [x + 2, y + 1],
        [x + 2, y - 1],
        [x - 2, y + 1],
        [x - 2, y - 1],
      ] as Pos[])
        .map((p) => [p, 1]),
    heuristic: (node) => distance(node, goal) / 3,
    success: (node) => node[0] === goal[0] && node[1] === goal[1],
    key: (node) => node[0] + "," + node[1],
  });

  assertEquals(result![1], 4);
  assertEquals(result![0], [
    [1, 1],
    [2, 3],
    [4, 4],
    [2, 5],
    [4, 6],
  ]);
});
