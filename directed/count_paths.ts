function cachedCountPaths<Node>(
  options: CountPathsOptions<Node>,
  node: Node,
  cache: Map<Node, number>,
): number {
  const result = cache.get(node);
  if (result) {
    return result;
  }
  let count: number;
  if (options.success(node)) {
    count = 1;
  } else {
    count = 0;
    for (const successor of options.successors(node)) {
      count += cachedCountPaths(options, successor, cache);
    }
  }
  cache.set(node, count);
  return count;
}

export interface CountPathsOptions<Node> {
  start: Node;
  successors: (node: Node) => Iterable<Node>;
  success: (node: Node) => boolean;
}

/**
 * Count the total number of possible paths to reach a destination. There must be no loops
 * in the graph, or the function will overflow its stack.
 *
 * # Example
 *
 * On a 8x8 board, find the total paths from the bottom-left square to the top-right square.
 *
 * ```
 * use pathfinding::prelude::count_paths;
 *
 * let n = count_paths(
 *     (0, 0),
 *     |&(x, y)| {
 *         [(x + 1, y), (x, y + 1)]
 *             .into_iter()
 *             .filter(|&(x, y)| x < 8 && y < 8)
 *     },
 *     |&c| c == (7, 7),
 * );
 * assert_eq!(n, 3432);
 * ```
 */
export function countPaths<Node>(options: CountPathsOptions<Node>): number {
  return cachedCountPaths(options, options.start, new Map());
}
