# lazy_pathfinding

This Deno library implements several pathfinding and graph algorithms.

This library does not need an entire graph to be provided to it ahead of time.
The nodes and edges must be provided by a successor function executed for each
node encountered, meaning that graphs are lazily initialized which allows for
procedural and infinite graphs to be used.

## Algorithms

The algorithms are generic over their arguments.

### Directed graphs

- [A*][A*]: find the shortest path in a weighted graph using an heuristic to
  guide the process.

### Undirected graphs

- [connected components][Connected components]: find disjoint connected sets of
  vertices.

## Documentation

See the generated docs at https://deno.land/x/lazy_pathfinding?doc.

## Using this library

```ts
import { aStar } from "https://deno.land/x/lazy_pathfinding/directed/a_star.ts";
```

## Related Projects

This project was ported from the Rust
[pathfinding](https://github.com/samueltardieu/pathfinding) library.

## Contributing

You are welcome to contribute by opening
[issues](https://github.com/Macil/lazy_pathfinding/issues) or submitting
[pull requests](https://github.com/Macil/lazy_pathfinding/pulls).

Implementations of additional similar graph algorithms, especially those in the
Rust [pathfinding](https://github.com/samueltardieu/pathfinding) library, are
welcome.
