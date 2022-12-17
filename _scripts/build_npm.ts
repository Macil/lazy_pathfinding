// npm publishing instructions:
//  deno run -A _scripts/build_npm.ts [VERSION]
//  cd npm && npm publish
import { walk } from "https://deno.land/std@0.168.0/fs/walk.ts";
import { join } from "https://deno.land/std@0.168.0/path/posix.ts";
import { SEP_PATTERN } from "https://deno.land/std@0.168.0/path/separator.ts";
import {
  build,
  BuildOptions,
  emptyDir,
} from "https://deno.land/x/dnt@0.32.0/mod.ts";

const version = Deno.args[0];
if (typeof version !== "string") {
  throw new Error("Missing version parameter");
}

await emptyDir("./npm");

const entryPoints: BuildOptions["entryPoints"] = [];
for await (
  const file of walk(".", {
    includeDirs: false,
    exts: [".ts"],
    skip: [/(?:^|[\\/])_/, /\.test\./],
  })
) {
  const nodePath = "./" + join(...file.path.split(SEP_PATTERN));
  entryPoints.push({
    name: nodePath.replace(/\.[^.]+$/, ""),
    path: nodePath,
  });
}

await build({
  entryPoints,
  outDir: "./npm",
  shims: {
    deno: "dev",
  },

  package: {
    // package.json properties
    name: "lazy-pathfinding",
    module: undefined,
    main: undefined,
    types: undefined,
    version,
    description: "Pathfinding library",
    license: "(MIT OR Apache-2.0)",
    sideEffects: false,
    homepage: "https://github.com/Macil/lazy_pathfinding#readme",
    repository: {
      type: "git",
      url: "git+https://github.com/Macil/lazy_pathfinding.git",
    },
    bugs: {
      url: "https://github.com/Macil/lazy_pathfinding/issues",
    },
  },
});

await Deno.copyFile("LICENSE-APACHE.txt", "npm/LICENSE-APACHE.txt");
await Deno.copyFile("LICENSE-MIT.txt", "npm/LICENSE-MIT.txt");
await Deno.copyFile("README.md", "npm/README.md");
