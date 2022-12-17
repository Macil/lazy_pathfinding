import { assertEquals } from "https://deno.land/std@0.167.0/testing/asserts.ts";
import { dijkstra } from "./dijkstra.ts";

Deno.test("dijkstra() doc example", () => {
  type Pos = [number, number];

  const goal: Pos = [4, 6];

  const result = dijkstra<Pos>({
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
