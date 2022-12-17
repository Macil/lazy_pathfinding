import { BinaryHeap } from "https://deno.land/std@0.167.0/collections/binary_heap.ts";
import { CostOptions, numberCostOptions } from "./cost_options.ts";
import { reversePath } from "./_reverse_path.ts";

export interface DijkstraOptions<Node, Cost = number> {
  start: Node;
  /**
   * Returns a list of successors for a given node, along with the cost for
   * moving from the node to the successor.
   */
  successors: (node: Node) => Iterable<[Node, Cost]>;
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
 * Compute a shortest path using the [Dijkstra search
 * algorithm](https://en.wikipedia.org/wiki/Dijkstra's_algorithm).
 *
 * Multiple equivalent nodes (determined by the {@link DijkstraOptions.key()} function) will never
 * be included twice in the path.
 *
 * The shortest path starting from {@link DijkstraOptions.start} up to a node for which {@link DijkstraOptions.success()} returns `true`
 * is computed and returned along with its total cost, or `undefined` is returned if no successful path
 * was found. The returned path comprises both the start and end node.
 *
 * # Example
 *
 * ```ts
 * import { assertEquals } from "https://deno.land/std@0.167.0/testing/asserts.ts";
 * import { dijkstra } from "https://deno.land/x/lazy_pathfinding/directed/dijkstra.ts";
 *
 * type Pos = [number, number];
 *
 * const goal: Pos = [4, 6];
 *
 * const result = dijkstra<Pos>({
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
 *   success: (node) => node[0] === goal[0] && node[1] === goal[1],
 *   key: (node) => node[0] + "," + node[1],
 * });
 *
 * assertEquals(result![1], 4);
 * ```
 */
export function dijkstra<Node, Cost = number>(
  options: DijkstraOptions<Node, Cost>,
): [Node[], Cost] | undefined {
  const [encounteredNodes, successNode] = dijkstraInternal(options);
  if (successNode === null) {
    return undefined;
  }
  const cost = encounteredNodes.get(successNode)!.cost;
  const path = reversePath(encounteredNodes, (e) => e.parentKey, successNode)
    .map((nodeKey) => encounteredNodes.get(nodeKey)!.node);
  return [path, cost];
}

export interface DijkstraEncounteredNodeEntry<Node, Cost> {
  node: Node;
  /**
   * Either the key of the parent or `null`.
   */
  parentKey: unknown;
  cost: Cost;
}

/**
 * @returns A map of encountered node keys to their parent key and cost, and the key
 * of the goal node reached if any or else `null`.
 */
function dijkstraInternal<Node, Cost>(
  options: DijkstraOptions<Node, Cost>,
): [Map<unknown, DijkstraEncounteredNodeEntry<Node, Cost>>, unknown] {
  const costOptions = options.costOptions ??
    numberCostOptions as CostOptions<unknown> as CostOptions<Cost>;

  const toSee = new BinaryHeap<SmallestCostHolder<Cost>>((a, b) =>
    compareSmallestCostHolders(costOptions, a, b)
  );
  toSee.push({
    cost: costOptions.zero,
    nodeKey: options.key(options.start),
  });

  const encounteredNodes = new Map<
    unknown,
    DijkstraEncounteredNodeEntry<Node, Cost>
  >();
  encounteredNodes.set(options.key(options.start), {
    node: options.start,
    parentKey: null,
    cost: costOptions.zero,
  });
  while (true) {
    const smallestCostHolder = toSee.pop();
    if (!smallestCostHolder) {
      break;
    }
    const { node, cost } = encounteredNodes.get(smallestCostHolder.nodeKey)!;
    if (options.success(node)) {
      return [encounteredNodes, smallestCostHolder.nodeKey];
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
          cost: newCost,
          nodeKey: successorKey,
        });
      }
    }
  }
  return [encounteredNodes, null];
}

interface SmallestCostHolder<Cost> {
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
  return costOptions.compareFn(a.cost, b.cost);
}
