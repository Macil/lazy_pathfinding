/**
 * Lookup entries until we get the same value as the index, with
 * path halving. Adding a new entry to the table consists
 * into pushing the table length.
 */
function getAndRedirect(table: number[], idx: number): number {
  while (idx !== table[idx]) {
    table[idx] = table[table[idx]];
    idx = table[idx];
  }
  return idx;
}

interface SeparateComponentsResults<Node> {
  setIdsByNode: Map<Node, number>;
  setIdsByGroup: number[];
}

/**
 * Separate components of an undirected graph into disjoint sets.
 *
 * @param groups is a set of group of vertices connected together. It is
 *   acceptable for a group to contain only one node. Empty groups
 *   receive special treatment (see below).
 *
 * Note that if you have a raw undirected graph, you can build
 * such a structure by creating a group for every vertex containing
 * the vertex itself and its immediate neighbours. The helper function {@link createGroups}
 * can be used for this.
 *
 * @returns This function returns a pair containing:
 *
 * - A mapping from every vertex to its set identifier. The set identifiers are
 * opaque and will not necessarily be compact. However, it is guaranteed that
 * they will not be greater than the number of groups.
 * - A mapping from every group to its set identifier, with the identifiers being
 * the same ones as the ones in the previous mapping. Each group corresponds to
 * the identifier at the same index, except for empty group whose identifier is
 * set to `-1`.
 */
export function separateComponents<Node>(
  groups: Node[][],
): SeparateComponentsResults<Node> {
  const setIdsByGroup: number[] = groups.map((_, index) => index);
  const setIdsByNode = new Map<Node, number>();

  groups.forEach((group, groupIndex) => {
    if (group.length === 0) {
      setIdsByGroup[groupIndex] = -1;
    }
    for (const node of group) {
      const nodeSetId = setIdsByNode.get(node);
      if (nodeSetId !== undefined) {
        setIdsByGroup[groupIndex] = getAndRedirect(
          setIdsByGroup,
          nodeSetId,
        );
        groupIndex = setIdsByGroup[groupIndex];
      } else {
        setIdsByNode.set(node, groupIndex);
      }
    }
  });
  for (const [key, groupIndex] of setIdsByNode) {
    setIdsByNode.set(key, getAndRedirect(setIdsByGroup, groupIndex));
  }
  for (let groupIndex = 0; groupIndex < setIdsByGroup.length; groupIndex++) {
    if (setIdsByGroup[groupIndex] !== -1) {
      const target = getAndRedirect(setIdsByGroup, groupIndex);
      // Due to path halving, this particular entry might not
      // be up-to-date yet.
      setIdsByGroup[groupIndex] = target;
    }
  }
  return { setIdsByNode, setIdsByGroup };
}

/**
 * Separate components of an undirected graph into disjoint sets.
 *
 * @param groups is a set of group of vertices connected together. It is
 *   acceptable for a group to contain only one node.
 * @returns This function returns a list of sets of nodes forming disjoint connected
 * sets.
 */
export function components<Node>(groups: Node[][]): Set<Node>[] {
  const { setIdsByGroup } = separateComponents(groups);
  const nodesBySetId = new Map<number, Set<Node>>();
  setIdsByGroup.forEach((setId, index) => {
    if (setId === -1) {
      return;
    }
    let nodeSet = nodesBySetId.get(setId);
    if (!nodeSet) {
      nodeSet = new Set();
      nodesBySetId.set(setId, nodeSet);
    }
    groups[index].forEach((node) => nodeSet!.add(node));
  });
  return Array.from(nodesBySetId.values());
}

/**
 * Extract connected components from a graph.
 *
 * @param starts is a collection of vertices to be considered as start points.
 * @param neighbors is a function returning the neighbors of a given node.
 * @returns A list of groups, each as a list of nodes. This value can be given as the
 * `groups` parameter of the {@link separateComponents()} or {@link components()} functions.
 */
export function createGroups<Node>(
  starts: Node[],
  neighbors: (node: Node) => Iterable<Node>,
): Node[][] {
  return starts.map((start) => [start, ...neighbors(start)]);
}

/**
 * Locate vertices amongst disjoint sets.
 *
 * @param components - A list of disjoint sets.
 * @returns This function returns a map between every vertex and the index of
 * the set it belongs to in the `components` list.
 */
export function componentIndex<Node>(
  components: Set<Node>[],
): Map<Node, number> {
  const result = new Map<Node, number>();
  components.forEach((component, index) => {
    component.forEach((node) => result.set(node, index));
  });
  return result;
}
