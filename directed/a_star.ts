import { BinaryHeap } from "https://deno.land/std@0.167.0/collections/binary_heap.ts";
import { CostOptions, numberCostOptions } from "./cost_options.ts";
import { reversePath } from "./_reverse_path.ts";

export interface AStarOptions<Node, Cost = number> {
  /**
   * The starting node.
   */
  start: Node;
  /**
   * Returns a list of successors for a given node, along with the cost for
   * moving from the node to the successor.
   */
  successors: (node: Node) => Iterable<[Node, Cost]>;
  /**
   * Returns an approximation of the cost from a given node to the goal.
   * The approximation must not be greater than the real cost, or a wrong shortest
   * path may be returned.
   */
  heuristic: (node: Node) => Cost;
  /**
   * Checks whether the goal has been reached. It is not a node as some
   * problems require a dynamic solution instead of a fixed node.
   */
  success: (node: Node) => boolean;
  /**
   * A function that returns a unique key for a node. Equal nodes must return keys
   * that are equal.
   * If the nodes are primitive values, are represented by persistent unique objects,
   * or are never encountered more than once, then the identity function (`x => x`)
   * can be used here.
   * Otherwise, a custom function that converts the node to a string is
   * recommended. (`JSON.stringify` can be used for this.)
   *
   * In the future, if the Javascript [Record and
   * Tuple](https://tc39.es/proposal-record-tuple/tutorial/) proposal is implemented,
   * then this option may be changed to be optional with a default value set to the identity function,
   * in order to make Record and Tuple nodes work as simply as possible.
   */
  key: (node: Node) => unknown;
  /**
   * This option lets custom functions for managing the Cost values be specified.
   * This is not necessary to use if the Cost type is a number.
   * This option is useful if you want a different type of Cost value, such as a tuple of numbers
   * representing separate resource costs where 1 of an earlier index is worth more than any amount in
   * further indexes.
   */
  costOptions?: CostOptions<Cost>;
}

/**
 * Compute a shortest path using the [A* search
 * algorithm](https://en.wikipedia.org/wiki/A*_search_algorithm).
 *
 * Multiple equivalent nodes (determined by the {@link AStarOptions.key()} function) will never
 * be included twice in the path.
 *
 * The shortest path starting from {@link AStarOptions.start} up to a node for which {@link AStarOptions.success()} returns `true`
 * is computed and returned along with its total cost, or `undefined` is returned if no successful path
 * was found. The returned path comprises both the start and end node.
 *
 * # Example
 *
 * ```ts
 * import { assertEquals } from "https://deno.land/std@0.167.0/testing/asserts.ts";
 * import { aStar } from "https://deno.land/x/lazy_pathfinding/directed/a_star.ts";
 *
 * type Pos = [number, number];
 *
 * function distance(a: Pos, b: Pos): number {
 *   return Math.abs(a[0] - a[1]) + Math.abs(b[0] - b[1]);
 * }
 *
 * const goal: Pos = [4, 6];
 *
 * const result = aStar<Pos>({
 *   start: [1, 1],
 *   successors: ([x, y]) =>
 *     ([
 *       [x + 1, y + 2],
 *       [x + 1, y - 2],
 *       [x - 1, y + 2],
 *       [x - 1, y - 2],
 *       [x + 2, y + 1],
 *       [x + 2, y - 1],
 *       [x - 2, y + 1],
 *       [x - 2, y - 1],
 *     ] as Pos[])
 *       .map((p) => [p, 1]),
 *   heuristic: (node) => distance(node, goal) / 3,
 *   success: (node) => node[0] === goal[0] && node[1] === goal[1],
 *   key: (node) => node[0] + "," + node[1],
 * });
 *
 * assertEquals(result![1], 4);
 * ```
 */
export function aStar<Node, Cost = number>(
  options: AStarOptions<Node, Cost>,
): [Node[], Cost] | undefined {
  const costOptions = options.costOptions ??
    numberCostOptions as CostOptions<unknown> as CostOptions<Cost>;

  const toSee = new BinaryHeap<SmallestCostHolder<Cost>>((a, b) =>
    compareSmallestCostHolders(costOptions, a, b)
  );
  toSee.push({
    estimatedCost: costOptions.zero,
    cost: costOptions.zero,
    nodeKey: options.key(options.start),
  });

  interface EncounteredNodeEntry<Node, Cost> {
    node: Node;
    /**
     * Either the key of the parent or `undefined`.
     */
    parentKey: unknown;
    cost: Cost;
  }
  const encounteredNodes = new Map<unknown, EncounteredNodeEntry<Node, Cost>>();
  encounteredNodes.set(options.key(options.start), {
    node: options.start,
    parentKey: undefined,
    cost: costOptions.zero,
  });
  while (true) {
    const smallestCostHolder = toSee.pop();
    if (!smallestCostHolder) {
      break;
    }
    const { node, cost } = encounteredNodes.get(smallestCostHolder.nodeKey)!;
    if (options.success(node)) {
      const path = reversePath(
        encounteredNodes,
        (e) => e.parentKey,
        smallestCostHolder.nodeKey,
      )
        .map((nodeKey) => encounteredNodes.get(nodeKey)!.node);
      return [path, cost];
    }
    // We may have inserted a node several time into the binary heap if we found
    // a better way to access it. Ensure that we are currently dealing with the
    // best path and discard the others.
    if (costOptions.compareFn(smallestCostHolder.cost, cost) > 0) {
      continue;
    }
    const successors = options.successors(node);
    for (const [successor, moveCost] of successors) {
      const newCost = costOptions.add(cost, moveCost);
      const successorKey = options.key(successor);
      const heuristicCost = options.heuristic(successor);
      const encounteredNodeEntry = encounteredNodes.get(successorKey);

      // if we've never seen this node or encounteredNodeEntry.cost > newCost,
      // then record this path as the best path to get to get to this node.
      if (
        !encounteredNodeEntry ||
        costOptions.compareFn(encounteredNodeEntry.cost, newCost) > 0
      ) {
        encounteredNodes.set(successorKey, {
          node: successor,
          parentKey: smallestCostHolder.nodeKey,
          cost: newCost,
        });
        toSee.push({
          estimatedCost: costOptions.add(newCost, heuristicCost),
          cost: newCost,
          nodeKey: successorKey,
        });
      }
    }
  }
  return undefined;
}

interface SmallestCostHolder<Cost> {
  /**
   * The estimated cost through this node to the goal.
   */
  estimatedCost: Cost;
  /**
   * The cost to reach this node.
   */
  cost: Cost;
  nodeKey: unknown;
}

function compareSmallestCostHolders<Cost>(
  costOptions: CostOptions<Cost>,
  a: SmallestCostHolder<Cost>,
  b: SmallestCostHolder<Cost>,
): number {
  const estimatedCostsCompared = costOptions.compareFn(
    a.estimatedCost,
    b.estimatedCost,
  );
  if (estimatedCostsCompared !== 0) {
    return estimatedCostsCompared;
  }
  return costOptions.compareFn(a.cost, b.cost);
}

/**
 * Compute all shortest paths using the [A* search
 * algorithm](https://en.wikipedia.org/wiki/A*_search_algorithm). Whereas {@link aStar}
 * (non-deterministic-ally) returns a single shortest path, `aStarBag` returns all shortest paths
 * (in a non-deterministic order).
 *
 * Multiple equivalent nodes (determined by the {@link AStarOptions.key()} function) will never
 * be included twice in the path.
 *
 * The shortest paths starting from {@link AStarOptions.start} up to a node for which {@link AStarOptions.success()} returns `true`
 * are computed and returned in an iterable along with the cost (which, by definition, is the same for
 * each shortest path). If no paths are found, `undefined` is returned. Each path comprises both the start and an end node. Note that while every path shares the same
 * start node, different paths may have different end nodes.
 */
export function aStarBag<Node, Cost = number>(
  options: AStarOptions<Node, Cost>,
): [Iterable<Node[]>, Cost] | undefined {
  const costOptions = options.costOptions ??
    numberCostOptions as CostOptions<unknown> as CostOptions<Cost>;

  const startKey = options.key(options.start);

  let minCost: Cost | undefined;
  const sinks = new Set<unknown>();

  const toSee = new BinaryHeap<SmallestCostHolder<Cost>>((a, b) =>
    compareSmallestCostHolders(costOptions, a, b)
  );
  toSee.push({
    estimatedCost: costOptions.zero,
    cost: costOptions.zero,
    nodeKey: startKey,
  });

  interface EncounteredNodeEntry<Node, Cost> {
    node: Node;
    parentKeys: Set<unknown>;
    cost: Cost;
  }
  const encounteredNodes = new Map<unknown, EncounteredNodeEntry<Node, Cost>>();
  encounteredNodes.set(startKey, {
    node: options.start,
    parentKeys: new Set(),
    cost: costOptions.zero,
  });
  while (true) {
    const smallestCostHolder = toSee.pop();
    if (!smallestCostHolder) {
      break;
    }
    if (
      minCost !== undefined &&
      costOptions.compareFn(smallestCostHolder.estimatedCost, minCost) > 0
    ) {
      break;
    }
    const { node, cost } = encounteredNodes.get(smallestCostHolder.nodeKey)!;
    if (options.success(node)) {
      minCost = cost;
      sinks.add(smallestCostHolder.nodeKey);
    }
    // We may have inserted a node several time into the binary heap if we found
    // a better way to access it. Ensure that we are currently dealing with the
    // best path and discard the others.
    if (costOptions.compareFn(smallestCostHolder.cost, cost) > 0) {
      continue;
    }
    const successors = options.successors(node);
    for (const [successor, moveCost] of successors) {
      const newCost = costOptions.add(cost, moveCost);
      const successorKey = options.key(successor);
      const heuristicCost = options.heuristic(successor);
      const encounteredNodeEntry = encounteredNodes.get(successorKey);

      if (!encounteredNodeEntry) {
        encounteredNodes.set(successorKey, {
          node: successor,
          parentKeys: new Set([smallestCostHolder.nodeKey]),
          cost: newCost,
        });
      } else {
        const comparisonResult = costOptions.compareFn(
          encounteredNodeEntry.cost,
          newCost,
        );
        if (comparisonResult > 0) { // if encounteredNodeEntry.cost > newCost
          encounteredNodeEntry.parentKeys.clear();
          encounteredNodeEntry.parentKeys.add(smallestCostHolder.nodeKey);
          encounteredNodeEntry.cost = newCost;
        } else {
          if (comparisonResult === 0) {
            // New parent with an identical cost, this is not
            // considered as an insertion.
            encounteredNodeEntry.parentKeys.add(smallestCostHolder.nodeKey);
          }
          continue;
        }
      }

      toSee.push({
        estimatedCost: costOptions.add(newCost, heuristicCost),
        cost: newCost,
        nodeKey: successorKey,
      });
    }
  }

  if (minCost !== undefined) {
    const sinks_ = Array.from(sinks);

    const paths = (function* () {
      const path: Node[] = [];

      function* step(path: Node[], currentKey: unknown): Iterable<Node[]> {
        const parentKeys = encounteredNodes.get(currentKey)!.parentKeys;
        for (const parentKey of parentKeys) {
          path.push(encounteredNodes.get(parentKey)!.node);
          if (parentKey === startKey) {
            yield path.toReversed();
          } else {
            yield* step(path, parentKey);
          }
          path.pop();
        }
      }

      for (const sink of sinks_) {
        path.push(encounteredNodes.get(sink)!.node);
        yield* step(path, sink);
        path.pop();
      }
    })();
    return [paths, minCost];
  }
  return undefined;
}
