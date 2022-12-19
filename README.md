# lazy_pathfinding

This library implements several pathfinding and graph algorithms. This library
works with Typescript and Javascript in both Deno and Node.

Where possible, this library does not need an entire graph to be provided to it
ahead of time. Many functions allow nodes and edges to be provided by a
successor function executed for each node encountered, meaning that graphs are
lazily initialized which allows for procedural and infinite graphs to be used.

## Algorithms

The algorithms are generic over their arguments.

### Directed graphs

- [A*](https://en.wikipedia.org/wiki/A*_search_algorithm): find the shortest
  path in a weighted graph using an heuristic to guide the process.
- [Dijkstra](https://en.wikipedia.org/wiki/Dijkstra's_algorithm): find the
  shortest path in a weighted graph.

### Undirected graphs

- [connected components](https://en.wikipedia.org/wiki/Connected_component_(graph_theory)):
  find disjoint connected sets of vertices.

## Documentation

See the generated docs at https://deno.land/x/lazy_pathfinding?doc.

## Using this library

### Deno

Import functions directly from their modules:

```ts
import { aStar } from "https://deno.land/x/lazy_pathfinding/directed/a_star.ts";
```

### Node

Use npm to install
[lazy-pathfinding](https://www.npmjs.com/package/lazy-pathfinding) and then
import functions directly from their modules:

```
npm install lazy-pathfinding
```

```ts
import { aStar } from "lazy-pathfinding/directed/a_star";
```

If you're using Typescript with Node, then you must set the `moduleResolution`
compiler option to "nodenext" in your `tsconfig.json`:

```jsonc
{
  "compilerOptions": {
    "moduleResolution": "nodenext"
    // ...
  }
}
```

## Related Projects

This project was ported from the Rust
[pathfinding](https://github.com/samueltardieu/pathfinding) library.

## License

This code is released under a dual Apache 2.0 / MIT free software license.

## Contributing

You are welcome to contribute by opening
[issues](https://github.com/Macil/lazy_pathfinding/issues) or submitting
[pull requests](https://github.com/Macil/lazy_pathfinding/pulls).

Implementations of additional similar graph algorithms, especially those in the
Rust [pathfinding](https://github.com/samueltardieu/pathfinding) library, are
welcome.
