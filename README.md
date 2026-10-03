![material-icon-resolver](https://raw.githubusercontent.com/kazuito/material-icon-resolver/main/assets/banner.png)

# material-icon-resolver

[![npm version](https://img.shields.io/npm/v/material-icon-resolver?color=b6f045&labelColor=0a0a0a)](https://www.npmjs.com/package/material-icon-resolver)
[![license](https://img.shields.io/npm/l/material-icon-resolver?color=b6f045&labelColor=0a0a0a)](./LICENSE)

Find the [Material Icon Theme](https://github.com/material-extensions/vscode-material-icon-theme) icon for any file path, folder path, or VS Code language ID. You get back the icon name, the SVG filename, and a CDN URL ready to drop into an `<img>`.

**[Website](https://material-icon-resolver.vercel.app)** · **[Playground](https://material-icon-resolver.vercel.app/playground)** · **[llms.txt](https://material-icon-resolver.vercel.app/llms.txt)** · **[npm](https://www.npmjs.com/package/material-icon-resolver)**

```ts
import { getMaterialIconCdnUrl } from "material-icon-resolver";

getMaterialIconCdnUrl("src/index.ts");
// "https://cdn.jsdelivr.net/npm/material-icon-theme@5.39.0/icons/typescript.svg"
```

## Contents

- [Features](#features)
- [Install](#install)
- [Quick start](#quick-start)
- [How it works](#how-it-works)
- [Recipes](#recipes)
- [API reference](#api-reference)
- [Options](#options)
- [Types](#types)
- [Resolution rules](#resolution-rules)
- [Versioning and icon data](#versioning-and-icon-data)
- [Limitations](#limitations)
- [FAQ](#faq)
- [For AI agents](#for-ai-agents)
- [Development](#development)
- [License](#license)

## Features

- **Same associations as VS Code.** Lookup tables come from the upstream Material Icon Theme source, so `package.json` gets `nodejs`, `vite.config.ts` gets `vite`, `src/` gets `folder-src`, and so on, as they do in the editor.
- **Files, folders, and language IDs.** Resolve a path, or resolve a [VS Code language ID](https://code.visualstudio.com/docs/languages/identifiers) (`"typescriptreact"`, `"shellscript"`, …) directly. That helps with editors like Monaco, where the path may be synthetic.
- **CDN URLs included.** jsDelivr by default, unpkg optionally, or your own host via `baseUrl`. URLs use the exact upstream version the tables were built from, so they don't 404.
- **Zero dependencies, tiny, synchronous.** Pure string lookups with no I/O and no async. The files don't need to exist.
- **Split entries.** Import `/file` or `/folder` to load only one lookup table.
- **Works everywhere.** ESM + CommonJS with bundled type declarations, in Node, Bun, Deno, browsers, and edge runtimes.

## Install

```sh
npm install material-icon-resolver
# or
pnpm add material-icon-resolver
yarn add material-icon-resolver
bun add material-icon-resolver
```

Deno:

```ts
import { resolveMaterialIcon } from "npm:material-icon-resolver";
```

Browser without a bundler (ES module from a CDN):

```html
<script type="module">
  import { resolveMaterialIcon } from "https://cdn.jsdelivr.net/npm/material-icon-resolver/+esm";
</script>
```

> **Note:** This package does **not** contain any SVG files. It tells you *which* icon to use and *where* to load it from. The SVGs are served from the [`material-icon-theme`](https://www.npmjs.com/package/material-icon-theme) npm package via a CDN, or from wherever you host them (see [Self-hosting the SVGs](#self-hosting-the-svgs)).

## Quick start

### Resolve a file

```ts
import { resolveMaterialIcon } from "material-icon-resolver";

resolveMaterialIcon("src/index.ts");
// {
//   name: "typescript",
//   filename: "typescript.svg",
//   cdnUrl: "https://cdn.jsdelivr.net/npm/material-icon-theme@5.39.0/icons/typescript.svg",
//   type: "file",
//   source: "fileExtensions",
// }
```

### Resolve a folder

Pass `type: "folder"`. Pass `open: true` for the expanded variant.

```ts
resolveMaterialIcon("src", { type: "folder" });
// { name: "folder-src", filename: "folder-src.svg", type: "folder", source: "folderNames", ... }

resolveMaterialIcon("src", { type: "folder", open: true });
// { name: "folder-src", filename: "folder-src-open.svg", ... }
```

### Resolve a language ID

```ts
import { resolveMaterialIconByLanguageId } from "material-icon-resolver";

resolveMaterialIconByLanguageId("rust");
// { name: "rust", filename: "rust.svg", type: "file", source: "languageIds", ... }
```

You can also pass `languageId` alongside a path as a fallback hint. It is used only when the path itself doesn't match a specific filename or extension:

```ts
resolveMaterialIcon("scratch.unknown-ext", { languageId: "rust" }); // → rust (path missed, languageId used)
resolveMaterialIcon("package.json", { languageId: "rust" });        // → nodejs (filename match wins)
```

### Just the name or the URL

```ts
import { getMaterialIconName, getMaterialIconCdnUrl } from "material-icon-resolver";

getMaterialIconName("package.json");
// "nodejs"

getMaterialIconCdnUrl("package.json");
// "https://cdn.jsdelivr.net/npm/material-icon-theme@5.39.0/icons/nodejs.svg"
```

## How it works

```
"src/app/page.tsx"
   │  normalize: "\" → "/", strip ?query / #hash and trailing "/", lowercase
   ▼
lookup tables (generated from material-icon-theme@5.39.0, bundled in this package)
   │  parent/basename → basename → longest extension → languageId → fallback
   ▼
icon name "react_ts"
   │  + "-open" for expanded folders, + ".svg"
   ▼
{ name, filename, cdnUrl, type, source }
```

1. The path is treated as a plain string and never touched on disk.
2. It is matched against lookup tables generated from the upstream theme's source (`fileIcons.ts`, `folderIcons.ts`, `languageIcons.ts`). The tables ship inside this package, so no network request happens at resolve time.
3. The icon name becomes an SVG filename and a URL. Only your `<img>` tag (or whatever loads `cdnUrl`) touches the network.

Every result includes a `source` field that says which table matched. That is handy for debugging or for showing a "generic icon" state in your UI.

## Recipes

### Render an icon

```tsx
import { resolveMaterialIcon } from "material-icon-resolver";

function FileIcon({ path, isDir = false, isOpen = false }: {
  path: string;
  isDir?: boolean;
  isOpen?: boolean;
}) {
  const icon = resolveMaterialIcon(path, {
    type: isDir ? "folder" : "file",
    open: isOpen,
  })!; // never null with the default fallback
  return <img src={icon.cdnUrl} alt="" width={16} height={16} />;
}
```

### File tree

```tsx
type Node = { name: string; path: string; children?: Node[] };

function Tree({ node, expanded }: { node: Node; expanded: Set<string> }) {
  const isDir = node.children !== undefined;
  const isOpen = expanded.has(node.path);
  const icon = resolveMaterialIcon(node.path, { type: isDir ? "folder" : "file", open: isOpen })!;

  return (
    <li>
      <img src={icon.cdnUrl} alt="" width={16} height={16} /> {node.name}
      {isDir && isOpen && (
        <ul>
          {node.children!.map((child) => (
            <Tree key={child.path} node={child} expanded={expanded} />
          ))}
        </ul>
      )}
    </li>
  );
}
```

Folder matching only looks at the last path segment, so passing the full path or just the name gives the same result.

### Monaco editor tabs

Monaco models often have synthetic URIs like `inmemory://model/1`. Use the model's language ID instead:

```ts
import {
  resolveMaterialIcon,
  resolveMaterialIconByLanguageId,
} from "material-icon-resolver";

// Path is meaningful: use it, with the language ID as a fallback hint
const icon = resolveMaterialIcon(model.uri.path, { languageId: model.getLanguageId() });

// Path is meaningless: resolve from the language ID alone
const icon2 = resolveMaterialIconByLanguageId(model.getLanguageId());
```

### Detect "no specific icon"

Use `fallback: "none"` to get `null` instead of the generic icon, or check `source`:

```ts
resolveMaterialIcon("data.xyz", { fallback: "none" }); // null
resolveMaterialIcon("data.xyz")?.source;                // "default"
```

### Self-hosting the SVGs

If you don't want to depend on a public CDN, copy the SVGs from the upstream package and point `baseUrl` at them. Install the **same version** the tables were built from (`metadata.upstreamVersion`, currently `5.39.0`):

```sh
npm install --save-dev material-icon-theme@5.39.0
cp -r node_modules/material-icon-theme/icons public/icons
```

```ts
getMaterialIconCdnUrl("main.rs", { baseUrl: "/icons" });
// "/icons/rust.svg"

getMaterialIconCdnUrl("main.rs", { baseUrl: "https://assets.example.com/icons/" });
// "https://assets.example.com/icons/rust.svg"
```

### Smaller bundles with split entries

The root entry includes both the file and folder tables. If you only need one side, import from a subpath:

```ts
import { resolveMaterialFileIcon } from "material-icon-resolver/file";
import { resolveMaterialFolderIcon } from "material-icon-resolver/folder";

resolveMaterialFileIcon("src/index.ts");
resolveMaterialFolderIcon("src", { open: true });
```

```js
// CommonJS works the same way
const { resolveMaterialFileIcon } = require("material-icon-resolver/file");
```

Approximate gzipped size at `5.39.0`, including the lookup data:

| Entry | Contains | gzip |
| --- | --- | --- |
| `material-icon-resolver` | Files + folders + language IDs | ~16 kB |
| `material-icon-resolver/file` | Files + language IDs | ~12 kB |
| `material-icon-resolver/folder` | Folders | ~4.5 kB |

## API reference

All functions are synchronous and pure. The `path` argument accepts POSIX (`a/b`) and Windows (`a\b`) separators, and matching is case-insensitive.

### Root entry (`material-icon-resolver`)

#### `resolveMaterialIcon(path, options?)`

```ts
function resolveMaterialIcon(
  path: string,
  options?: ResolveMaterialIconOptions,
): ResolvedMaterialIcon | null;
```

Resolve a file or folder path. `options.type` picks the mode (`"file"` by default). Returns `null` only when `fallback: "none"` and nothing matched.

```ts
resolveMaterialIcon("Dockerfile")?.name;                           // "docker"
resolveMaterialIcon("lib.d.ts")?.name;                             // "typescript-def"
resolveMaterialIcon("node_modules", { type: "folder" })?.name;     // "folder-node"
resolveMaterialIcon("anything.weird", { fallback: "none" });       // null
```

#### `resolveMaterialIconByLanguageId(languageId, options?)`

```ts
function resolveMaterialIconByLanguageId(
  languageId: string,
  options?: ResolveByLanguageIdOptions,
): ResolvedMaterialIcon | null;
```

Resolve a [VS Code language ID](https://code.visualstudio.com/docs/languages/identifiers), matched case-insensitively. The result always has `type: "file"` (or `"folder"` if you explicitly pass `fallback: "folder"` and nothing matches). Accepts `cdn`, `version`, `baseUrl`, `fallback`.

```ts
resolveMaterialIconByLanguageId("typescriptreact")?.name;           // "react_ts"
resolveMaterialIconByLanguageId("shellscript")?.name;               // "console"
resolveMaterialIconByLanguageId("plaintext")?.name;                 // "document"
resolveMaterialIconByLanguageId("not-a-language", { fallback: "none" }); // null
```

#### `getMaterialIconName(path, options?)`

```ts
function getMaterialIconName(path: string, options?: ResolveMaterialIconOptions): string | null;
```

Shorthand for `resolveMaterialIcon(path, options)?.name`. The name has no `.svg` extension and no `-open` suffix.

```ts
getMaterialIconName("package.json");                    // "nodejs"
getMaterialIconName("src", { type: "folder" });         // "folder-src"
```

#### `getMaterialIconCdnUrl(path, options?)`

```ts
function getMaterialIconCdnUrl(path: string, options?: ResolveMaterialIconOptions): string | null;
```

Shorthand for `resolveMaterialIcon(path, options)?.cdnUrl`.

```ts
getMaterialIconCdnUrl("package.json");
// "https://cdn.jsdelivr.net/npm/material-icon-theme@5.39.0/icons/nodejs.svg"

getMaterialIconCdnUrl("src/index.ts", { cdn: "unpkg" });
// "https://unpkg.com/material-icon-theme@5.39.0/icons/typescript.svg"
```

#### `buildCdnUrl({ cdn, version, filename })`

```ts
function buildCdnUrl(input: { cdn: CdnProvider; version: string; filename: string }): string;
```

Build a CDN URL from a filename you already have.

```ts
buildCdnUrl({ cdn: "jsdelivr", version: "5.39.0", filename: "typescript.svg" });
// "https://cdn.jsdelivr.net/npm/material-icon-theme@5.39.0/icons/typescript.svg"
```

#### `buildBaseUrl(baseUrl, filename)`

```ts
function buildBaseUrl(baseUrl: string, filename: string): string;
```

Join a base URL and a filename, normalizing one trailing slash.

```ts
buildBaseUrl("/icons", "typescript.svg");  // "/icons/typescript.svg"
buildBaseUrl("/icons/", "typescript.svg"); // "/icons/typescript.svg"
```

#### `metadata`

Where the bundled tables came from:

```ts
metadata;
// {
//   upstreamVersion: "5.39.0",          // also the default CDN `version`
//   upstreamCommit: "92a9c5b2…",        // commit of the upstream release tag
//   upstreamRepo: "material-extensions/vscode-material-icon-theme",
//   generatedAt: "2026-…Z",             // ISO 8601 timestamp
// }
```

#### `MATERIAL_ICON_THEME_PACKAGE`

The constant `"material-icon-theme"`: the npm package name used in CDN URLs.

### File entry (`material-icon-resolver/file`)

Also re-exported from the root entry. Doesn't load the folder table.

| Function | Signature |
| --- | --- |
| `resolveMaterialFileIcon` | `(path, options?: ResolveMaterialFileIconOptions) => ResolvedMaterialIcon \| null` |
| `resolveMaterialFileIconByLanguageId` | `(languageId, options?: ResolveFileByLanguageIdOptions) => ResolvedMaterialIcon \| null` |
| `getMaterialFileIconName` | `(path, options?: ResolveMaterialFileIconOptions) => string \| null` |
| `getMaterialFileIconCdnUrl` | `(path, options?: ResolveMaterialFileIconOptions) => string \| null` |

File options: `cdn`, `version`, `baseUrl`, `languageId` (path functions only), and `fallback: "file" | "none"` (default `"file"`).

### Folder entry (`material-icon-resolver/folder`)

Also re-exported from the root entry. Doesn't load the file table.

| Function | Signature |
| --- | --- |
| `resolveMaterialFolderIcon` | `(path, options?: ResolveMaterialFolderIconOptions) => ResolvedMaterialIcon \| null` |
| `getMaterialFolderIconName` | `(path, options?: ResolveMaterialFolderIconOptions) => string \| null` |
| `getMaterialFolderIconCdnUrl` | `(path, options?: ResolveMaterialFolderIconOptions) => string \| null` |

Folder options: `cdn`, `version`, `baseUrl`, `open`, and `fallback: "folder" | "none"` (default `"folder"`).

## Options

`ResolveMaterialIconOptions`, accepted by the root path functions. The other option types are subsets of it.

| Option | Type | Default | Description |
| --- | --- | --- | --- |
| `type` | `"file" \| "folder"` | `"file"` | Resolve `path` as a file or a folder. |
| `open` | `boolean` | `false` | Folders only. Use the expanded variant: `filename` and `cdnUrl` get `-open` (`folder-src-open.svg`), `name` stays `folder-src`. |
| `languageId` | `string` | — | Files only. VS Code language ID used when the path matches no filename or extension. A specific path match always wins. Ignored for folders. |
| `fallback` | `"file" \| "folder" \| "none"` | same as `type` | What to return when nothing matches: the generic `file` icon, the generic `folder` icon, or `null`. |
| `cdn` | `"jsdelivr" \| "unpkg"` | `"jsdelivr"` | CDN used to build `cdnUrl`. |
| `version` | `string` | `metadata.upstreamVersion` (`"5.39.0"`) | `material-icon-theme` version in `cdnUrl`. See [Versioning](#versioning-and-icon-data) before changing it. |
| `baseUrl` | `string` | — | Build `cdnUrl` as `<baseUrl>/<filename>` instead of using a CDN. Overrides `cdn` and `version`. |

Which option types accept what:

| Type | Used by | Accepts |
| --- | --- | --- |
| `ResolveMaterialIconOptions` | `resolveMaterialIcon`, `getMaterialIconName`, `getMaterialIconCdnUrl` | all of the above |
| `ResolveByLanguageIdOptions` | `resolveMaterialIconByLanguageId` | `cdn`, `version`, `baseUrl`, `fallback` |
| `ResolveMaterialFileIconOptions` | `resolveMaterialFileIcon`, `getMaterialFileIcon*` | `cdn`, `version`, `baseUrl`, `languageId`, `fallback: "file" \| "none"` |
| `ResolveFileByLanguageIdOptions` | `resolveMaterialFileIconByLanguageId` | `cdn`, `version`, `baseUrl`, `fallback: "file" \| "none"` |
| `ResolveMaterialFolderIconOptions` | `resolveMaterialFolderIcon`, `getMaterialFolderIcon*` | `cdn`, `version`, `baseUrl`, `open`, `fallback: "folder" \| "none"` |

## Types

```ts
type ResolvedMaterialIcon = {
  /** Icon name, e.g. "typescript", "folder-src". No ".svg", no "-open". */
  name: string;
  /** SVG filename, e.g. "typescript.svg", "folder-src-open.svg". */
  filename: string;
  /** Full SVG URL, built from cdn + version, or from baseUrl. */
  cdnUrl: string;
  type: "file" | "folder";
  /** Which lookup table matched. */
  source: ResolveSource;
};

type ResolveSource =
  | "fileNamesWithPath" // parent folder + basename, e.g. "src/bashly.yml"
  | "fileNames"         // exact basename, e.g. "package.json", "Dockerfile"
  | "fileExtensions"    // extension, e.g. ".ts", ".d.ts", ".test.ts"
  | "languageIds"       // VS Code language ID
  | "rootFolderNames"   // reserved; not produced by the current tables
  | "folderNames"       // folder basename, e.g. "src", ".vscode"
  | "default";          // nothing matched; generic icon from `fallback`

type IconType = "file" | "folder";
type FallbackMode = "file" | "folder" | "none";
type CdnProvider = "jsdelivr" | "unpkg";
```

Every type above and every option type is exported from the root entry.

> **Tip:** The return type is always `ResolvedMaterialIcon | null` because `fallback: "none"` can produce `null`. With the default fallback the result is never `null` at runtime, so a non-null assertion (`!`) or a small guard is safe.

## Resolution rules

### Path normalization

Before lookup, the path is:

- converted from `\` to `/` (`C:\proj\README.md` works),
- stripped of any `?query` or `#hash` (`https://example.com/a/b.tsx?raw=1` → `react_ts`),
- stripped of a trailing `/` (`src/` works as a folder),
- lowercased (`SRC/INDEX.TS` → `typescript`).

### Files

The first match wins:

| # | Table | Key | Example |
| --- | --- | --- | --- |
| 1 | `fileNamesWithPath` | `<parent folder>/<basename>` | `src/bashly.yml` → `bashly` (plain `bashly.yml` → `yaml`) |
| 2 | `fileNames` | full basename | `package.json` → `nodejs`, `.gitignore` → `git`, `Makefile` → `makefile` |
| 3 | `fileExtensions` | extensions, longest first | `button.test.ts` tries `test.ts` → `test-ts` before `ts`; `lib.d.ts` → `typescript-def` |
| 4 | `languageIds` | `options.languageId` | `resolveMaterialIcon("untitled", { languageId: "typescript" })` → `typescript` |
| 5 | fallback | — | `file` icon (`source: "default"`), or per `fallback` |

Only the immediate parent folder is used in step 1.

### Folders

The first match wins:

| # | Table | Key | Example |
| --- | --- | --- | --- |
| 1 | `folderNames` | last path segment | `src` → `folder-src`, `src/components` → `folder-components`, `node_modules` → `folder-node` |
| 2 | fallback | — | `folder` icon (`source: "default"`), or per `fallback` |

Folder names include the upstream alias variants: `name`, `.name`, `_name`, `-name`, and `__name__`. So `src`, `.src`, `_src`, `-src`, and `__src__` all resolve to `folder-src`, and `__tests__` resolves to `folder-test`.

### Language IDs

Language IDs map to the icon VS Code shows for that language: `typescriptreact` → `react_ts`, `javascriptreact` → `react`, `dockerfile` → `docker`, `jsonc` → `json`. Unknown IDs fall back like any other miss.

## Versioning and icon data

- **Pinned upstream.** Each release of this package is generated from one tagged release of `vscode-material-icon-theme`, currently **5.39.0**. You can check it at runtime with `metadata.upstreamVersion`.
- **Why the CDN version is pinned too.** Upstream adds, renames, and occasionally removes icons. The bundled tables only know the icon names that exist in the pinned release, so `cdnUrl` uses the same version by default. CI checks every referenced icon against the published npm tarball, so every default URL points at an SVG that exists.
- **Using `version: "latest"`.** Allowed, but you mix this package's associations with a newer icon set. If upstream renames an icon, the URL may 404. Prefer upgrading this package instead.
- **Staying current.** New upstream releases are tracked, and this package is regenerated and released for them. Update `material-icon-resolver` to get new icons and associations.
- **Package version ≠ upstream version.** `material-icon-resolver` follows its own semver. Use `metadata.upstreamVersion` to see which icon set you have.

## Limitations

These parts of the VS Code extension are intentionally not supported:

- **Icon packs other than the default.** Upstream's default `activeIconPack` is `"angular"`. Icons gated behind other packs (vue, react, qwik, NestJS, …) aren't included.
- **User customizations.** Custom `files.associations` / `folders.associations`, and per-user settings of the extension.
- **Light and high-contrast variants.** Only the default (dark-theme) icons are resolved.
- **Clone icons.** Icons that upstream generates at build time by recoloring another icon (`clone: { … }`) aren't published in the npm package, so they're skipped.
- **Workspace-root awareness.** The library doesn't know which folder is your workspace root, so root-only folder associations (`rootFolderNames`) aren't applied. The current upstream data defines none.

## FAQ

**Why does a file get a different icon than in my VS Code?**
Usually one of: you use a non-default icon pack, you have custom associations, the file's language was detected from its contents (VS Code can do this; this library only sees the path), or your extension version differs from `metadata.upstreamVersion`.

**Does it read the file or check that it exists?**
No. Only the string is inspected. Pass anything: real paths, URLs, virtual paths, user input.

**Does it work in the browser or on the edge?**
Yes. There are no Node built-ins, no dependencies, and no I/O.

**Can I get the SVG markup instead of a URL?**
Not from this package. Fetch `cdnUrl`, or self-host the SVGs and import them with your bundler, using `name` / `filename` as the key.

**How do I try paths without installing?**
Open the **[Playground](https://material-icon-resolver.vercel.app/playground)**: paste paths and see the resolved icons live.

## For AI agents

A condensed, self-contained reference written for LLMs and coding agents is served at **[`/llms.txt`](https://material-icon-resolver.vercel.app/llms.txt)**. This README remains the canonical, complete documentation.

## Development

```sh
git clone --recurse-submodules https://github.com/kazuito/material-icon-resolver.git
cd material-icon-resolver
bun install
```

Bun workspace: the library lives in `packages/material-icon-resolver`, the website and playground in `apps/website`. Run library commands from `packages/material-icon-resolver`.

| Command | What it does |
| --- | --- |
| `bun run test` | Run the vitest suites |
| `bun run typecheck` | `tsc --noEmit` |
| `bun run build` | Build ESM/CJS + type declarations with tsdown |
| `bun run lint` / `bun run format` | Biome |
| `bun run generate` | Regenerate `src/generated/*.ts` from the pinned upstream submodule |
| `bun run sync-vscode-languages` | Refresh the VS Code language-ID map, then regenerate |
| `bun run validate-icons` | Check that every referenced SVG exists in the published `material-icon-theme` tarball |
| `bun run --filter website dev` | Run the website and playground locally (from the repo root) |

- Upstream lives as a git submodule at `packages/material-icon-resolver/vendor/vscode-material-icon-theme`, pinned to a release tag. To bump it, check out the new tag in the submodule, then run `bun run generate && bun run validate-icons && bun run test`.
- `src/generated/*.ts` is generated: don't edit it by hand.
- Language IDs come from the upstream `languageIcons.ts`, expanded through the explicit upstream file associations, the `contributes.languages` of VS Code's built-in extensions, and a small hand-maintained map with cited sources (`packages/material-icon-resolver/scripts/language-id-extensions.ts`).

See [`AGENTS.md`](./AGENTS.md) for the full contributor guide.

## License

[MIT](./LICENSE). Icons belong to the [Material Icon Theme](https://github.com/material-extensions/vscode-material-icon-theme) project (MIT) and are loaded from its npm package. They are not redistributed here.

Created by [Kazuma Ito](https://github.com/kazuito).
