import { BinaryHeap } from "https://deno.land/std@0.189.0/collections/binary_heap.ts";
import { reversePath } from "./_reverse_path.ts";
import { CostOptions, numberCostOptions } from "./cost_options.ts";

export interface DijkstraOptions<Node, Cost = number> {
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
  /**
   * Stop considering paths that have a cost greater than this value.
   */
  maxCost?: Cost;
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
 * import { assertEquals } from "https://deno.land/std@0.189.0/testing/asserts.ts";
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
  const [encounteredNodes, successNodeKey] = dijkstraInternal(options);
  if (successNodeKey === undefined) {
    return undefined;
  }
  const cost = encounteredNodes.get(successNodeKey)!.cost;
  const path = buildPath(successNodeKey, encounteredNodes);
  return [path, cost];
}

export interface DijkstraEncounteredNodeEntry<Node, Cost> {
  node: Node;
  /**
   * Either the key of the parent or `undefined`.
   */
  parentKey: unknown;
  cost: Cost;
}

/**
 * Determine all reachable nodes from a starting point as well as the minimum cost to
 * reach them and a possible optimal parent node
 * using the [Dijkstra search algorithm](https://en.wikipedia.org/wiki/Dijkstra's_algorithm).
 *
 * The result is a map where the key of every reachable node is associated with the node
 * value, an optimal parent node, and a cost from the start node.
 *
 * The {@link buildPath} function can be used to build a full path from the starting point to one
 * of the reachable targets.
 *
 * # Example
 *
 * We use a graph of integer nodes from 1 to 9, each node leading to its double and the value
 * after it with a cost of 10 at every step.
 *
 * ```ts
 * const encounteredNodes = dijkstraAll({
 *   start: 1,
 *   successors: (n) => n <= 4 ? [[n * 2, 10], [n * 2 + 1, 10]] : [],
 *   key: (n) => n,
 * });
 * assertEquals(encounteredNodes.size, 9);
 * assertEquals(encounteredNodes.get(1), {
 *   node: 1,
 *   parentKey: undefined,
 *   cost: 0,
 * });
 * assertEquals(encounteredNodes.get(2), {
 *   node: 2,
 *   parentKey: 1,
 *   cost: 10,
 * });
 * assertEquals(encounteredNodes.get(3), {
 *   node: 3,
 *   parentKey: 1,
 *   cost: 10,
 * });
 * ```
 */
export function dijkstraAll<Node, Cost>(
  options: Omit<DijkstraOptions<Node, Cost>, "success">,
): Map<unknown, DijkstraEncounteredNodeEntry<Node, Cost>> {
  return dijkstraInternal({ ...options, success: () => false })[0];
}

/**
 * Determine some reachable nodes from a starting point as well as the minimum cost to
 * reach them and a possible optimal parent node
 * using the [Dijkstra search algorithm](https://en.wikipedia.org/wiki/Dijkstra's_algorithm).
 *
 * The result is a map where the key of every node examined up until the algorithm reaches a node where
 * {@link DijkstraOptions.success} returns true is associated with a node value, an optimal parent
 * node, and a cost from the start node, as well as the node which caused the algorithm to stop if
 * any.
 *
 * The {@link buildPath} function can be used to build a full path from the starting point to one
 * of the reachable targets.
 */
export function dijkstraPartial<Node, Cost>(
  options: DijkstraOptions<Node, Cost>,
): [Map<unknown, DijkstraEncounteredNodeEntry<Node, Cost>>, Node | undefined] {
  const [encounteredNodes, successNodeKey] = dijkstraInternal(options);
  const successNode = successNodeKey === undefined
    ? undefined
    : encounteredNodes.get(successNodeKey)!.node;
  return [encounteredNodes, successNode];
}

/**
 * Build a path leading to a target according to a parents map, which must
 * contain no loop. This function can be used after {@link dijkstraAll} or
 * {@link dijkstraPartial} to build a path from a starting point to a reachable target.
 *
 * @param target is reachable target.
 * @param encounteredNodes is a map containing an optimal parent, a node's value, and an associated
 *   cost which is ignored here for every reachable node's key.
 *
 * @returns an array with a path from the farthest parent up to the target, including
 * the target itself.
 */
export function buildPath<Node>(
  targetKey: unknown,
  encounteredNodes: ReadonlyMap<
    unknown,
    DijkstraEncounteredNodeEntry<Node, unknown>
  >,
): Node[] {
  return reversePath(encounteredNodes, (e) => e.parentKey, targetKey)
    .map((nodeKey) => encounteredNodes.get(nodeKey)!.node);
}

/**
 * @returns A map of encountered node keys to their parent key and cost, and the key
 * of the goal node reached if any or else `undefined`.
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

      if (
        options.maxCost !== undefined &&
        costOptions.compareFn(newCost, options.maxCost) > 0
      ) {
        continue;
      }

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
  return [encounteredNodes, undefined];
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
