import { assertEquals } from "https://deno.land/std@0.168.0/testing/asserts.ts";
import { dijkstra, dijkstraAll, dijkstraPartial } from "./dijkstra.ts";

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

Deno.test("dijkstraAll() doc example", () => {
  const encounteredNodes = dijkstraAll({
    start: 1,
    successors: (n) => n <= 4 ? [[n * 2, 10], [n * 2 + 1, 10]] : [],
    key: (n) => n,
  });
  assertEquals(encounteredNodes.size, 9);
  assertEquals(encounteredNodes.get(1), {
    node: 1,
    parentKey: undefined,
    cost: 0,
  });
  assertEquals(encounteredNodes.get(2), {
    node: 2,
    parentKey: 1,
    cost: 10,
  });
  assertEquals(encounteredNodes.get(3), {
    node: 3,
    parentKey: 1,
    cost: 10,
  });
  assertEquals(encounteredNodes.get(4), {
    node: 4,
    parentKey: 2,
    cost: 20,
  });
  assertEquals(encounteredNodes.get(5), {
    node: 5,
    parentKey: 2,
    cost: 20,
  });
  assertEquals(encounteredNodes.get(6), {
    node: 6,
    parentKey: 3,
    cost: 20,
  });
  assertEquals(encounteredNodes.get(7), {
    node: 7,
    parentKey: 3,
    cost: 20,
  });
  assertEquals(encounteredNodes.get(8), {
    node: 8,
    parentKey: 4,
    cost: 30,
  });
  assertEquals(encounteredNodes.get(9), {
    node: 9,
    parentKey: 4,
    cost: 30,
  });
});

Deno.test("dijkstraPartial, no success", () => {
  const [encounteredNodes, successNode] = dijkstraPartial({
    start: 1,
    successors: (n) => n <= 4 ? [[n * 2, 10], [n * 2 + 1, 10]] : [],
    success: () => false,
    key: (n) => n,
  });
  assertEquals(successNode, undefined);
  assertEquals(encounteredNodes.size, 9);
  assertEquals(encounteredNodes.get(1), {
    node: 1,
    parentKey: undefined,
    cost: 0,
  });
  assertEquals(encounteredNodes.get(2), {
    node: 2,
    parentKey: 1,
    cost: 10,
  });
  assertEquals(encounteredNodes.get(3), {
    node: 3,
    parentKey: 1,
    cost: 10,
  });
  assertEquals(encounteredNodes.get(4), {
    node: 4,
    parentKey: 2,
    cost: 20,
  });
  assertEquals(encounteredNodes.get(5), {
    node: 5,
    parentKey: 2,
    cost: 20,
  });
  assertEquals(encounteredNodes.get(6), {
    node: 6,
    parentKey: 3,
    cost: 20,
  });
  assertEquals(encounteredNodes.get(7), {
    node: 7,
    parentKey: 3,
    cost: 20,
  });
  assertEquals(encounteredNodes.get(8), {
    node: 8,
    parentKey: 4,
    cost: 30,
  });
  assertEquals(encounteredNodes.get(9), {
    node: 9,
    parentKey: 4,
    cost: 30,
  });
});

Deno.test("dijkstraPartial, successful", () => {
  const [encounteredNodes, successNode] = dijkstraPartial({
    start: 1,
    successors: (n) => n <= 4 ? [[n * 2, 10], [n * 2 + 1, 10]] : [],
    success: (n) => n === 7,
    key: (n) => n,
  });
  assertEquals(successNode, 7);
  assertEquals(encounteredNodes.size, 7);
  assertEquals(encounteredNodes.get(1), {
    node: 1,
    parentKey: undefined,
    cost: 0,
  });
  assertEquals(encounteredNodes.get(2), {
    node: 2,
    parentKey: 1,
    cost: 10,
  });
  assertEquals(encounteredNodes.get(3), {
    node: 3,
    parentKey: 1,
    cost: 10,
  });
  assertEquals(encounteredNodes.get(4), {
    node: 4,
    parentKey: 2,
    cost: 20,
  });
  assertEquals(encounteredNodes.get(5), {
    node: 5,
    parentKey: 2,
    cost: 20,
  });
  assertEquals(encounteredNodes.get(6), {
    node: 6,
    parentKey: 3,
    cost: 20,
  });
  assertEquals(encounteredNodes.get(7), {
    node: 7,
    parentKey: 3,
    cost: 20,
  });
});

Deno.test("dijkstraPartial, no success because of maxCost", () => {
  const [encounteredNodes, successNode] = dijkstraPartial({
    start: 1,
    successors: (n) => n <= 4 ? [[n * 2, 10], [n * 2 + 1, 10]] : [],
    success: (n) => n === 7,
    key: (n) => n,
    maxCost: 18,
  });
  assertEquals(successNode, undefined);
  assertEquals(encounteredNodes.size, 3);
  assertEquals(encounteredNodes.get(1), {
    node: 1,
    parentKey: undefined,
    cost: 0,
  });
  assertEquals(encounteredNodes.get(2), {
    node: 2,
    parentKey: 1,
    cost: 10,
  });
  assertEquals(encounteredNodes.get(3), {
    node: 3,
    parentKey: 1,
    cost: 10,
  });
});
