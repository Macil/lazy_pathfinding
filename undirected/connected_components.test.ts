import {
  assert,
  assertEquals,
  assertNotEquals,
} from "https://deno.land/std@0.167.0/testing/asserts.ts";
import { components, separateComponents } from "./connected_components.ts";

Deno.test("basic separate components", () => {
  const groups = [[1, 2], [3, 4], [5, 6], [1, 4]];
  const { setIdsByGroup, setIdsByNode } = separateComponents(groups);

  assert(
    [1, 2, 3, 4].map((n) => setIdsByNode.get(n)!).every((id, _, ids) =>
      id === ids[0]
    ),
  );
  assertEquals(setIdsByNode.get(5), setIdsByNode.get(6));
  assertNotEquals(setIdsByNode.get(1), setIdsByNode.get(5));
  assertEquals(setIdsByNode.size, 6);

  assertEquals(setIdsByGroup[0], setIdsByGroup[1]);
  assertEquals(setIdsByGroup[0], setIdsByGroup[3]);
  assertNotEquals(setIdsByGroup[0], setIdsByGroup[2]);
  assertEquals(setIdsByGroup.length, 4);
});

Deno.test("empty separate components", () => {
  const groups = [[1, 2], [3, 4], [], [1, 4]];
  const { setIdsByGroup, setIdsByNode } = separateComponents(groups);
  assert(
    [1, 2, 3, 4].map((n) => setIdsByNode.get(n)!).every((id, _, ids) =>
      id === ids[0]
    ),
  );
  assertEquals(setIdsByNode.size, 4);

  assertEquals(setIdsByGroup[0], setIdsByGroup[1]);
  assertEquals(setIdsByGroup[0], setIdsByGroup[3]);
  assertNotEquals(setIdsByGroup[0], setIdsByGroup[2]);
  assertEquals(setIdsByGroup[2], -1);
  assertEquals(setIdsByGroup.length, 4);
});

Deno.test("basic components", () => {
  const c = components([[1, 2], [3, 4], [5, 6], [1, 4, 7]]);
  assertEquals(c.length, 2);
  assertEquals(Array.from(c[0]).sort((a, b) => a - b), [1, 2, 3, 4, 7]);
  assertEquals(Array.from(c[1]).sort((a, b) => a - b), [5, 6]);
});

Deno.test("empty components", () => {
  const c = components([[1, 2], [3, 4], [], [1, 4, 7]]);
  assertEquals(c.length, 1);
  assertEquals(Array.from(c[0]).sort((a, b) => a - b), [1, 2, 3, 4, 7]);
});
