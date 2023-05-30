export function reversePath<Entry>(
  encounteredNodes: ReadonlyMap<unknown, Entry>,
  extractParentNodeKey: (entry: Entry) => unknown,
  startNodeKey: unknown,
): unknown[] {
  const list: unknown[] = [];
  let nodeKey = startNodeKey;
  while (nodeKey) {
    const entry = encounteredNodes.get(nodeKey);
    if (!entry) {
      break;
    }
    list.push(nodeKey);
    nodeKey = extractParentNodeKey(entry);
  }
  list.reverse();
  return list;
}
