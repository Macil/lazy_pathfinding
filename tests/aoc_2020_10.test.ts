// Test from https://adventofcode.com/2020/day/10

import { assertEquals } from "https://deno.land/std@0.167.0/testing/asserts.ts";
import { countPaths } from "../directed/count_paths.ts";

Deno.test("part 2", () => {
  const adapters = INPUT.trimEnd().split("\n").map(Number);
  adapters.sort((a, b) => a - b);
  const last = adapters[adapters.length - 1];
  const n = countPaths({
    start: 0,
    successors: (x) => adapters.filter((y) => y > x && y <= x + 3),
    success: (x) => x === last,
  });
  assertEquals(n, 19208);
});

const INPUT = `\
28
33
18
42
31
14
46
20
48
47
24
23
49
45
19
38
39
11
1
32
25
35
8
17
7
9
4
2
34
10
3
`;
