import { assertEquals } from "https://deno.land/std@0.189.0/testing/asserts.ts";
import { aStarBag } from "./a_star.ts";

Deno.test("multiple sinks", () => {
  // 1 --> 2 --> 4
  //   --> 3 --> 4
  //
  // 2 --> 5 --> 6 --> 7
  // 3 --> 5 --> 6 --> 7
  const [solutions, cost] = aStarBag({
    start: 1,
    successors: (node) => {
      switch (node) {
        case 1:
          return [[2, 1], [3, 1]];
        case 2:
        case 3:
          return [[4, 3], [5, 1]];
        case 5:
          return [[6, 1]];
        case 6:
          return [[7, 1]];
        default:
          return [];
      }
    },
    heuristic: () => 0,
    success: (node) => node === 4 || node === 7,
    key: (node) => node,
  })!;
  assertEquals(cost, 4);
  assertEquals(
    Array.from(solutions).sort(),
    [
      [1, 2, 4],
      [1, 2, 5, 6, 7],
      [1, 3, 4],
      [1, 3, 5, 6, 7],
    ],
  );
});

Deno.test("numerous solutions", () => {
  const N = 10;
  const GOAL = 3 * N;
  //     ---> 1 --
  //    /     |   \
  // 0--      |    --> 3 … --> 3*N with 2^N paths and a cost of 2*N
  //    \     v   /            (path from 1 to 2 is unused)
  //     ---> 2 --
  const [solutions, cost] = aStarBag({
    start: 0,
    successors: (node) =>
      node % 3 === 2 ? [[node + 1, 1]] : [
        [node + 1, 1],
        [node + 2, 1],
      ],
    heuristic: (node) => (GOAL - node) / 2,
    success: (node) => node === GOAL,
    key: (node) => node,
  })!;
  assertEquals(cost, N * 2);
  assertEquals(Array.from(solutions).length, 1 << N);
});

Deno.test("multiple sinks, max cost", () => {
  // 1 --> 2 --> 4
  //   --> 3 --> 4
  //
  // 2 --> 5 --> 6 --> 7
  // 3 --> 5 --> 6 --> 7
  const result = aStarBag({
    start: 1,
    successors: (node) => {
      switch (node) {
        case 1:
          return [[2, 1], [3, 1]];
        case 2:
        case 3:
          return [[4, 3], [5, 1]];
        case 5:
          return [[6, 1]];
        case 6:
          return [[7, 1]];
        default:
          return [];
      }
    },
    heuristic: () => 0,
    success: (node) => node === 4 || node === 7,
    key: (node) => node,
    maxCost: 3,
  });
  assertEquals(result, undefined);
});
