// Test from https://adventofcode.com/2021/day/12

import { assertEquals } from "https://deno.land/std@0.189.0/testing/asserts.ts";
import once from "https://deno.land/x/once@0.3.0/index.ts";
import { countPaths } from "../directed/count_paths.ts";

const parseInput = once(() => {
  const map = new Map<string, string[]>();
  for (const line of INPUT.trimEnd().split("\n")) {
    const [a, b] = line.split("-");

    let aList = map.get(a);
    if (!aList) {
      aList = [];
      map.set(a, aList);
    }
    aList.push(b);

    let bList = map.get(b);
    if (!bList) {
      bList = [];
      map.set(b, bList);
    }
    bList.push(a);
  }
  return map;
});

interface State {
  current: string;
  smallCaves: string[];
  smallCaveTwice: boolean;
}

function solve(smallCaveTwice: boolean): number {
  const map = parseInput();
  return countPaths<State>({
    start: {
      current: "start",
      smallCaves: [],
      smallCaveTwice,
    },
    successors: (node) =>
      map.get(node.current)!
        .filter((x) =>
          x !== "start" && (!node.smallCaves.includes(x) || node.smallCaveTwice)
        )
        .map((x) => ({
          current: x,
          smallCaves: [...node.smallCaves, ...(x[0] >= "a" ? [x] : [])],
          smallCaveTwice: node.smallCaveTwice && !node.smallCaves.includes(x),
        })),
    success: (node) => node.current === "end",
  });
}

Deno.test("part 1", () => {
  assertEquals(solve(false), 226);
});

Deno.test("part 2", () => {
  assertEquals(solve(true), 3509);
});

const INPUT = `\
fs-end
he-DX
fs-he
start-DX
pj-DX
end-zg
zg-sl
zg-pj
pj-he
RW-he
fs-DX
pj-RW
zg-RW
start-pj
he-WI
zg-he
pj-fs
start-RW
`;
