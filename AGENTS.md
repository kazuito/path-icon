# path-icon

Resolve VS Code Material Icon Theme icon names, SVG filenames, and CDN URLs from file or folder paths. TypeScript library with ESM and CommonJS builds, distributed via npm.

Bun workspace monorepo:

- `packages/path-icon/` — the published library. **All library paths below (`src/`, `scripts/`, `test/`, `vendor/`, `dist/`) are relative to this directory**, and library commands run from here.
- `apps/website/` — Next.js docs site + playground (see `apps/website/AGENTS.md`). Vercel Root Directory: `apps/website`.
- Root `package.json` only holds workspaces, lefthook (`lefthook.yml`), and `bun run --filter` fan-out scripts (`lint`, `format`, `typecheck`, `build`, `test`).
- `README.md` / `LICENSE` live at the repo root; the library's `prepack` copies them into the package so npm ships them.

## Repo Map

- `src/index.ts` — public API re-exports
- `src/resolve.ts` — `resolveMaterialIcon`, `getMaterialIconName`, `getMaterialIconCdnUrl`
- `src/file.ts` — file-only resolver for `path-icon/file`; imports only file icon generated data
- `src/folder.ts` — folder-only resolver for `path-icon/folder`; imports only folder icon generated data
- `src/result.ts` — shared result / CDN URL construction
- `src/normalize.ts` — path normalization, basename/parent split, extension candidates
- `src/packed.ts` — `unpack` decoder for the brace-trie packed tables in `src/generated/*.ts`; also used by the generator's round-trip assertion
- `src/cdn.ts` — jsDelivr / unpkg / `baseUrl` URL builders
- `src/types.ts` — public type definitions
- `src/generated/*.ts` — **auto-generated; do not edit by hand**. Re-run `bun run generate`.
- `scripts/generate.ts` — reads upstream `vscode-material-icon-theme` from the `vendor/` git submodule and rebuilds `src/generated/*.ts`
- `scripts/sync-vscode-languages.ts` — regenerates `scripts/generated/vscode-language-map.json` (language id → extensions/fileNames) from the `contributes.languages` of VS Code built-in extensions at a pinned tag
- `scripts/language-id-extensions.ts` — residual language-id associations from third-party extensions; each entry cites its origin
- `vendor/vscode-material-icon-theme/` — git submodule pinned to a specific upstream release tag; the source of truth for which version is generated
- `scripts/validate-icons.ts` — fetches the published npm tarball and asserts every referenced SVG name actually exists
- `test/` — vitest suites (file resolver, folder resolver, CDN URL)
- `dist/` — tsdown output (`.mjs` / `.cjs` + `.d.mts` / `.d.cts`); gitignored
- `PLAN.md` — original Japanese design doc, kept for context

## Commands

```bash
git submodule update --init --recursive  # required before first generate
bun install          # from the repo root
# from packages/path-icon:
bun run typecheck    # tsc --noEmit
bun run test         # vitest run
bun run build        # tsdown → ESM/CJS outputs for root, file, and folder entries
bun run generate     # regenerate src/generated/*.ts from the pinned submodule
bun run sync-vscode-languages  # refresh scripts/generated/vscode-language-map.json from the pinned VS Code tag, then regenerate
bun run validate-icons  # fetch npm tarball, check every referenced SVG exists
bun run lint         # biome lint
bun run format       # biome format --write
```

## Workflow Expectations

- After editing source, run `bun run typecheck && bun run test && bun run build` before declaring done.
- When to run which regeneration command:

  | You changed | Run |
  |---|---|
  | `vendor/` submodule (icon theme bump) | `bun run generate` → `bun run validate-icons` → `bun run test` |
  | `VSCODE_TAG` in `scripts/sync-vscode-languages.ts` | `bun run sync-vscode-languages` (regenerates automatically) → `bun run test` |
  | `scripts/language-id-extensions.ts` (residual map) | `bun run generate` → `bun run test` |

  Rule of thumb: changed any generator input → `bun run generate`; want newer VS Code language data → `bun run sync-vscode-languages`, which chains `bun run generate` for you.
- After bumping the upstream version: `bun run generate` → `bun run validate-icons` → `bun run test` → update `metadata.upstreamVersion` consumers.
- Never hand-edit `src/generated/*.ts`; treat them like build artifacts that happen to be checked in.
- Internal relative imports must include the `.ts` extension (`./resolve.ts`, not `./resolve`). `tsconfig.json` enables `allowImportingTsExtensions` + `rewriteRelativeImportExtensions`; tsdown rewrites them at build time.

## Generator Setup

- Upstream `material-extensions/vscode-material-icon-theme` lives as a git submodule at `packages/path-icon/vendor/vscode-material-icon-theme`, pinned to a specific release tag.
- First time setup: `git submodule update --init --recursive`. Fresh clones should use `git clone --recurse-submodules ...`.
- The generator imports `src/core/icons/{fileIcons,folderIcons,languageIcons}.ts` directly from the submodule's checked-out tree and records the submodule HEAD commit in `metadata.upstreamCommit`. No worktree is created.
- To bump the upstream version: `cd packages/path-icon/vendor/vscode-material-icon-theme && git fetch --tags && git checkout v<new-version> && cd -`, then `git add packages/path-icon/vendor/vscode-material-icon-theme` and run `bun run generate`. **Always pin to a release tag** — the submodule's `main` HEAD often contains unreleased icons whose SVGs aren't yet on the CDN.
- `MATERIAL_ICON_THEME_REPO=/path/to/clone` is supported as an escape hatch (e.g. for testing against a local upstream working copy); when set, the script reads that path's HEAD instead of the submodule. Caller is responsible for checking out a sensible ref.

## Codebase Rules

- File resolver order: `fileNamesWithPath[parent/basename]` → `fileNames[basename]` → `fileExtensions[longest…shortest]` → fallback. All keys lowercase.
- Folder resolver order: `rootFolderNames[basename]` → `folderNames[basename]` → fallback. Keys are pre-expanded with the upstream `extendFolderNames` rule (`name`, `.name`, `_name`, `-name`, `__name__`).
- The `-open` suffix for expanded folders is appended only at filename construction in `src/result.ts#makeResult`; map values store the bare icon name.
- Keep file-only and folder-only entry points independent: `src/file.ts` must not import `src/generated/folder-icons.ts`, and `src/folder.ts` must not import `src/generated/file-icons.ts`.
- Generated tables are packed as `name|keys` groups joined by `;`, where `keys` is a brace-expansion trie (`webpack.{base.{cjs,js},cjs}`), an empty key means the key equals `name`, and folder icons drop the `folder-` prefix. Keys or icons containing `; | , { }`, and folder icons without the `folder-` prefix, fail `bun run generate`. Lookup tables are `Object.create(null)`, so keys like `constructor` / `__proto__` behave as ordinary keys.
- Icons with `clone: { ... }` in upstream are **skipped** by the generator — upstream generates those SVGs at runtime and they aren't published in the npm package. Don't try to add them back.
- Default `activeIconPack` is `"angular"` (matches upstream `defaultConfig`). Icons gated by other packs (vue, react, qwik, …) are excluded.
- VS Code language IDs ARE used. Upstream `languageIcons.ts` is read at generate time and each language id is expanded to file extensions / fileNames through layered sources, first write wins: (1) explicit `fileIcons.ts#fileExtensions` / `fileNames` entries, (2) `scripts/generated/vscode-language-map.json` — synced from the `contributes.languages` of VS Code's built-in extensions at the tag pinned in `scripts/sync-vscode-languages.ts` (`bun run sync-vscode-languages` to refresh; bump `VSCODE_TAG` there for a newer VS Code), (3) the residual hand map `scripts/language-id-extensions.ts` for ids defined by third-party marketplace extensions — every entry must cite its origin (`via … — <url>` or `curated: …`), (4) for ids with no source whose icon would otherwise be unreachable, the id itself is used as a file extension (fallback). `bun run generate` warns when a residual entry goes stale or fully shadowed (delete it) and when a new upstream id lands in the fallback (add a sourced entry or re-sync).
- Custom icon associations, light/highContrast variants, and clone icons remain out of scope (see `PLAN.md` §4).

## Safety / Gotchas

- `package.json#exports` uses per-condition types (`import.types` → `.d.mts`, `require.types` → `.d.cts`) for proper dual-package type resolution. `typesVersions` is set so legacy `--moduleResolution node` consumers can resolve `./file` and `./folder` subpaths. If you change build entry names, output extensions, or declaration filenames, update `exports` and `typesVersions` to match. Validate with `bunx @arethetypeswrong/cli --pack .` (all entries should be 🟢 across node10/node16/bundler).
- `tsdown.config.ts` has `minify: true` for size; debugging the bundle requires reading source instead.
- Default `version` in `ResolveMaterialIconOptions` is pinned to `metadata.upstreamVersion`, not `latest`. Users opt into `latest` explicitly. Don't change this default — the generated association table only matches the pinned version's SVG inventory.
- The validator fetches the tarball from `registry.npmjs.org` directly (it does not call `npm pack`, which previously hit local cache permission issues).
