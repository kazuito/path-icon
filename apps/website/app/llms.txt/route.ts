import { metadata } from "path-icon";
import { siteConfig, siteUrl } from "@/lib/site";

export const dynamic = "force-static";

const v = metadata.upstreamVersion;
const jsdelivr = `https://cdn.jsdelivr.net/npm/material-icon-theme@${v}/icons`;

const body = `# ${siteConfig.name}

> \`path-icon\` is a zero-dependency TypeScript library that maps a file path, folder path, or VS Code language ID to the matching [Material Icon Theme](https://github.com/${metadata.upstreamRepo}) icon: its icon name, SVG filename, and a CDN URL to the SVG. It works in Node, Bun, Deno, and browsers, ships ESM + CJS with types, and bundles lookup tables generated from \`material-icon-theme@${v}\`.

This file is a condensed digest. The canonical, complete documentation is the [README](https://raw.githubusercontent.com/kazuito/path-icon/main/README.md) (raw Markdown); prefer it when this digest is not enough.

Key facts:

- Package: \`path-icon\` on npm. Install with \`npm install path-icon\` (or pnpm / yarn / bun).
- The library does **not** ship SVGs. It returns names and URLs; the SVGs are served from the \`material-icon-theme\` npm package via jsDelivr (default) or unpkg, or from your own host via \`baseUrl\`.
- All functions are pure and synchronous. No I/O, no filesystem access: the path is only parsed as a string, and the file does not need to exist.
- Default CDN version is pinned to \`${v}\` (\`metadata.upstreamVersion\`), not \`latest\`, because the bundled tables match that release's SVG set exactly.
- Matching is case-insensitive. POSIX and Windows separators are both accepted. A \`?query\` or \`#hash\` suffix and a trailing slash are stripped.
- With the default \`fallback\`, every call returns an icon (the generic \`file\` or \`folder\` icon on a miss). Only \`fallback: "none"\` makes functions return \`null\`.
- Out of scope: custom user icon associations, light / high-contrast variants, icon packs other than the default \`angular\` pack (e.g. vue / react-only variants), and upstream "clone" icons.

## Quick start

\`\`\`ts
import { getIcon } from "path-icon";

getIcon("src/index.ts");
// {
//   name: "typescript",
//   filename: "typescript.svg",
//   url: "${jsdelivr}/typescript.svg",
//   type: "file",
//   source: "fileExtensions",
// }

getIcon("src", { type: "folder" });
// { name: "folder-src", filename: "folder-src.svg", url: "${jsdelivr}/folder-src.svg", type: "folder", source: "folderNames" }

getIcon("src", { type: "folder", open: true });
// { name: "folder-src", filename: "folder-src-open.svg", ... }
\`\`\`

Render it:

\`\`\`tsx
const icon = getIcon(path, { type: isDir ? "folder" : "file", open: isExpanded })!;
<img src={icon.url} alt="" width={16} height={16} />
\`\`\`

## Entry points

| Import | Contains | Use when |
| --- | --- | --- |
| \`path-icon\` | File + folder + language-ID resolvers, CDN helpers, \`metadata\` | You need both files and folders |
| \`path-icon/file\` | File + language-ID resolvers only (no folder table) | Smaller bundle, files only |
| \`path-icon/folder\` | Folder resolver only (no file table) | Smaller bundle, folders only |

ESM (\`import\`) and CommonJS (\`require\`) both work for every entry. The package has \`sideEffects: false\`.

## API

### \`getIcon(path: string, options?: IconOptions): PathIcon | null\`

Resolve from a file or folder path. Set \`type: "folder"\` for folders (default \`"file"\`).

### \`getIconByLanguageId(languageId: string, options?: LanguageIdOptions): PathIcon | null\`

Resolve from a [VS Code language ID](https://code.visualstudio.com/docs/languages/identifiers) such as \`"typescript"\`, \`"rust"\`, \`"shellscript"\`. Useful with Monaco or any editor where the path is synthetic. Result has \`type: "file"\` and \`source: "languageIds"\`. Accepts \`cdn\`, \`version\`, \`baseUrl\`, \`fallback\`.

### File-only functions (from \`path-icon/file\` or the root entry)

- \`getFileIcon(path, options?: FileIconOptions): PathIcon | null\`
- \`getFileIconByLanguageId(languageId, options?: FileLanguageIdOptions): PathIcon | null\`

Options: \`cdn\`, \`version\`, \`baseUrl\`, \`languageId\` (not on the ByLanguageId variant), \`fallback: "file" | "none"\` (default \`"file"\`).

### Folder-only functions (from \`path-icon/folder\` or the root entry)

- \`getFolderIcon(path, options?: FolderIconOptions): PathIcon | null\`

Options: \`cdn\`, \`version\`, \`baseUrl\`, \`open\`, \`fallback: "folder" | "none"\` (default \`"folder"\`). Only the last path segment is matched (\`"a/b/src"\` → \`folder-src\`).

### Utilities (root entry only)

- \`buildCdnUrl({ cdn, version, filename }): string\` — e.g. \`buildCdnUrl({ cdn: "unpkg", version: "${v}", filename: "rust.svg" })\` → \`"https://unpkg.com/material-icon-theme@${v}/icons/rust.svg"\`.
- \`joinBaseUrl(baseUrl, filename): string\` — joins with one \`/\`; \`joinBaseUrl("/icons/", "rust.svg")\` → \`"/icons/rust.svg"\`.
- \`MATERIAL_ICON_THEME_PACKAGE\` — \`"material-icon-theme"\`.
- \`metadata\` — \`{ upstreamVersion: "${v}", upstreamCommit: string, upstreamRepo: "${metadata.upstreamRepo}", generatedAt: string }\`.

## Options

\`IconOptions\` (other option types are subsets of this):

| Option | Type | Default | Description |
| --- | --- | --- | --- |
| \`type\` | \`"file" \\| "folder"\` | \`"file"\` | Resolve \`path\` as a file or a folder. |
| \`open\` | \`boolean\` | \`false\` | Folders only: use the expanded variant (\`folder-src-open.svg\`). \`name\` is unchanged; only \`filename\` / \`url\` get \`-open\`. |
| \`languageId\` | \`string\` | — | Files only: VS Code language ID used when the path matches no filename or extension. Ignored for folders. |
| \`fallback\` | \`"file" \\| "folder" \\| "none"\` | same as \`type\` | What to return on a miss. \`"none"\` returns \`null\`. |
| \`cdn\` | \`"jsdelivr" \\| "unpkg"\` | \`"jsdelivr"\` | CDN used for \`url\`. |
| \`version\` | \`string\` | \`"${v}"\` | \`material-icon-theme\` version in \`url\`. \`"latest"\` is allowed but may 404 for icons renamed upstream. |
| \`baseUrl\` | \`string\` | — | Self-hosted SVG directory. \`url\` becomes \`\${baseUrl}/\${filename}\`. Overrides \`cdn\` and \`version\`. |

## Result type

\`\`\`ts
type PathIcon = {
  name: string;      // icon name, e.g. "typescript", "folder-src" (no ".svg", no "-open")
  filename: string;  // e.g. "typescript.svg", "folder-src-open.svg"
  url: string;    // full SVG URL (or baseUrl-joined path)
  type: "file" | "folder";
  source: IconSource;
};

type IconSource =
  | "fileNamesWithPath" // matched "parent/basename", e.g. "src/bashly.yml"
  | "fileNames"         // matched full basename, e.g. "package.json", "Dockerfile"
  | "fileExtensions"    // matched an extension, e.g. ".ts", ".d.ts", ".test.ts"
  | "languageIds"       // matched a VS Code language ID
  | "rootFolderNames"   // reserved; not produced by the current tables
  | "folderNames"       // matched a folder basename, e.g. "src", ".vscode"
  | "default";          // no match; generic "file" / "folder" icon from fallback
\`\`\`

Exported types: \`PathIcon\`, \`IconSource\`, \`IconOptions\`, \`LanguageIdOptions\`, \`FileIconOptions\`, \`FileLanguageIdOptions\`, \`FolderIconOptions\`, \`CdnProvider\`, \`IconType\`, \`FallbackMode\`.

## Resolution order

Files (first match wins):

1. \`fileNamesWithPath\` — immediate parent folder + basename, e.g. \`src/bashly.yml\` → \`bashly\` (while plain \`bashly.yml\` → \`yaml\`).
2. \`fileNames\` — exact basename, e.g. \`package.json\` → \`nodejs\`, \`.gitignore\` → \`git\`, \`Dockerfile\` → \`docker\`.
3. \`fileExtensions\` — longest extension first: \`foo.test.ts\` tries \`test.ts\` → \`test-ts\`, then \`ts\`; \`lib.d.ts\` → \`typescript-def\`; \`page.tsx\` → \`react_ts\`.
4. \`languageIds\` — only when \`options.languageId\` is given, e.g. \`getIcon("x.unknown", { languageId: "rust" })\` → \`rust\`. A filename/extension match always beats \`languageId\`.
5. Fallback — \`file\` icon (or \`folder\` / \`null\` per \`fallback\`), \`source: "default"\`.

Folders (first match wins):

1. \`folderNames\` — basename, including upstream aliases: \`name\`, \`.name\`, \`_name\`, \`-name\`, \`__name__\` (so \`src\`, \`.src\`, \`_src\`, \`-src\`, \`__src__\` all → \`folder-src\`).
2. Fallback — \`folder\` icon (or \`file\` / \`null\` per \`fallback\`), \`source: "default"\`.

## Examples

\`\`\`ts
import { getIcon, getIconByLanguageId } from "path-icon";

getIcon("package.json")?.name;            // "nodejs"
getIcon("C:\\\\proj\\\\README.md")?.name;     // "readme"
getIcon("src/app/page.tsx")?.name;        // "react_ts"
getIcon(".env.local")?.name;              // "tune"
getIcon("node_modules", { type: "folder" })?.name; // "folder-node"
getIcon("whatever", { type: "folder" })?.name;  // "folder" (source: "default")
getIcon("a.unknownext")?.name;            // "file"   (source: "default")

getIcon("a.unknownext", { fallback: "none" });     // null
getIconByLanguageId("shellscript")?.name;          // "console"
getIconByLanguageId("nope", { fallback: "none" }); // null

getIcon("src/index.ts", { cdn: "unpkg" })?.url;
// "https://unpkg.com/material-icon-theme@${v}/icons/typescript.svg"

getIcon("src/index.ts", { baseUrl: "/icons" })?.url;
// "/icons/typescript.svg"
\`\`\`

Split entries:

\`\`\`ts
import { getFileIcon } from "path-icon/file";
import { getFolderIcon } from "path-icon/folder";

getFileIcon("src/index.ts", { languageId: "typescript" });
getFolderIcon("src", { open: true });

// CommonJS
const { getFileIcon } = require("path-icon/file");
\`\`\`

TypeScript note: with the default \`fallback\`, the result is never \`null\` at runtime, but the return type is still \`PathIcon | null\`. Use \`!\` or a guard.

## Self-hosting SVGs

Copy \`node_modules/material-icon-theme/icons/*.svg\` (install \`material-icon-theme@${v}\` to match the tables) to a public directory, then pass \`baseUrl\`:

\`\`\`ts
getIcon("main.rs", { baseUrl: "/icons" })?.url; // "/icons/rust.svg"
\`\`\`

## Links

- [Website](${siteUrl}/): overview, usage, API, options
- [Playground](${siteUrl}/playground): paste paths and see the resolved icons live
- [README (raw Markdown)](https://raw.githubusercontent.com/kazuito/path-icon/main/README.md): canonical, complete documentation
- [Source](${siteConfig.repo}): GitHub repository (MIT)
- [npm](${siteConfig.npm}): package page
- [Material Icon Theme](https://github.com/${metadata.upstreamRepo}): upstream icon set and association rules
- [VS Code language identifiers](https://code.visualstudio.com/docs/languages/identifiers): valid \`languageId\` values

## Author

Created by [${siteConfig.author.name}](${siteConfig.author.url}).
`;

export function GET() {
  return new Response(body, {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
}
