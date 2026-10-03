import assert from "node:assert/strict";
import { execSync } from "node:child_process";
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { homedir } from "node:os";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { unpack } from "../src/packed.ts";
import {
  type LanguageIdAssoc,
  languageIdAssociations,
} from "./language-id-extensions.ts";

const DEFAULT_ACTIVE_ICON_PACK = "angular";
const VSCODE_LANGUAGE_MAP_PATH = "scripts/generated/vscode-language-map.json";

type VscodeLanguageMap = {
  vscodeTag: string;
  languages: Record<string, LanguageIdAssoc>;
};
const FOLDER_THEME = "specific";
const SUBMODULE_PATH = "vendor/vscode-material-icon-theme";

function expandTilde(p: string): string {
  return p.startsWith("~") ? p.replace(/^~/, homedir()) : p;
}

function loadUpstream(sourceDir: string) {
  const fileIconsUrl = pathToFileURL(
    resolve(sourceDir, "src/core/icons/fileIcons.ts"),
  ).href;
  const folderIconsUrl = pathToFileURL(
    resolve(sourceDir, "src/core/icons/folderIcons.ts"),
  ).href;
  const languageIconsUrl = pathToFileURL(
    resolve(sourceDir, "src/core/icons/languageIcons.ts"),
  ).href;
  return Promise.all([
    import(fileIconsUrl) as Promise<{
      fileIcons: {
        defaultIcon: { name: string };
        icons: Array<{
          name: string;
          fileNames?: string[];
          fileExtensions?: string[];
          disabled?: boolean;
          enabledFor?: string[];
          clone?: unknown;
        }>;
      };
    }>,
    import(folderIconsUrl) as Promise<{
      folderIcons: Array<{
        name: string;
        defaultIcon: { name: string };
        rootFolder?: { name: string };
        icons?: Array<{
          name: string;
          folderNames?: string[];
          rootFolderNames?: string[];
          disabled?: boolean;
          enabledFor?: string[];
          clone?: unknown;
        }>;
      }>;
    }>,
    import(languageIconsUrl) as Promise<{
      languageIcons: Array<{
        name: string;
        ids: string[];
        disabled?: boolean;
        enabledFor?: string[];
        clone?: unknown;
      }>;
    }>,
  ]);
}

function isEnabled(icon: {
  disabled?: boolean;
  enabledFor?: string[];
  clone?: unknown;
}) {
  if (icon.disabled) return false;
  // Clone icons are dynamically generated at runtime by upstream and not
  // published as static SVGs, so they cannot be served from CDN.
  if (icon.clone !== undefined) return false;
  if (!icon.enabledFor) return true;
  return icon.enabledFor.includes(DEFAULT_ACTIVE_ICON_PACK);
}

const FOLDER_VARIANTS: ReadonlyArray<readonly [string, string]> = [
  ["", ""],
  [".", ""],
  ["_", ""],
  ["-", ""],
  ["__", "__"],
];

const folderNameVariants = (n: string) =>
  FOLDER_VARIANTS.map(([pre, suf]) => `${pre}${n}${suf}`);

function buildFileMaps(
  fileIcons: {
    icons: Array<{
      name: string;
      fileNames?: string[];
      fileExtensions?: string[];
      disabled?: boolean;
      enabledFor?: string[];
    }>;
  },
  languageIcons: Array<{
    name: string;
    ids: string[];
    disabled?: boolean;
    enabledFor?: string[];
    clone?: unknown;
  }>,
  vscodeLanguages: Record<string, LanguageIdAssoc>,
) {
  const fileNames: Record<string, string> = Object.create(null);
  const fileNamesWithPath: Record<string, string> = Object.create(null);
  const fileExtensions: Record<string, string> = Object.create(null);

  for (const icon of fileIcons.icons) {
    if (!isEnabled(icon)) continue;
    for (const raw of icon.fileNames ?? []) {
      const key = raw.toLowerCase();
      if (key.includes("/")) fileNamesWithPath[key] = icon.name;
      else fileNames[key] = icon.name;
    }
    for (const raw of icon.fileExtensions ?? []) {
      const key = raw.toLowerCase();
      // Upstream occasionally registers full filenames here (e.g. ".ncurc.js").
      // The runtime lookup builds extension candidates without a leading dot,
      // so dotted keys would be unreachable in fileExtensions. Route them to
      // fileNames where they will actually match.
      if (key.startsWith(".")) {
        if (key.includes("/")) fileNamesWithPath[key] = icon.name;
        else fileNames[key] = icon.name;
      } else {
        fileExtensions[key] = icon.name;
      }
    }
  }

  // Merge in associations derived from VS Code language IDs, two layers:
  // vscode-language-map.json (built-ins, synced from a pinned VS Code tag)
  // first, then the residual hand-maintained map for ids defined by
  // third-party extensions. Explicit fileExtensions / fileNames from
  // fileIcons.ts take precedence over both; first write wins throughout.
  const addAssoc = (assoc: LanguageIdAssoc, iconName: string): number => {
    let added = 0;
    for (const raw of assoc.extensions ?? []) {
      const key = raw.toLowerCase();
      if (!(key in fileExtensions)) {
        fileExtensions[key] = iconName;
        added++;
      }
    }
    for (const raw of assoc.fileNames ?? []) {
      const key = raw.toLowerCase();
      if (key.includes("/")) {
        if (!(key in fileNamesWithPath)) {
          fileNamesWithPath[key] = iconName;
          added++;
        }
      } else if (!(key in fileNames)) {
        fileNames[key] = iconName;
        added++;
      }
    }
    return added;
  };

  const seenLanguageIds = new Set<string>();
  const shadowedResidualIds: string[] = [];
  const unsourced: Array<{ id: string; iconName: string }> = [];
  for (const icon of languageIcons) {
    if (!isEnabled(icon)) continue;
    for (const id of icon.ids) {
      seenLanguageIds.add(id);
      const builtin = vscodeLanguages[id];
      const residual = languageIdAssociations[id];
      if (!builtin && !residual) {
        unsourced.push({ id, iconName: icon.name });
        continue;
      }
      if (builtin) addAssoc(builtin, icon.name);
      if (residual && addAssoc(residual, icon.name) === 0) {
        shadowedResidualIds.push(id);
      }
    }
  }

  // An id without a source only matters if its icon is otherwise unreachable
  // through the path-based maps (most unsourced ids alias icons that explicit
  // upstream entries already cover). For those, fall back to treating the id
  // itself as a file extension so a brand-new upstream language id degrades
  // to a plausible association instead of silently missing.
  const reachableIcons = new Set([
    ...Object.values(fileNames),
    ...Object.values(fileNamesWithPath),
    ...Object.values(fileExtensions),
  ]);
  const EXTENSION_LIKE_ID = /^[a-z0-9_+-]+$/;
  const fallbackIds: string[] = [];
  const unresolvedIds: string[] = [];
  for (const { id, iconName } of unsourced) {
    if (reachableIcons.has(iconName)) continue;
    if (EXTENSION_LIKE_ID.test(id) && !(id in fileExtensions)) {
      fileExtensions[id] = iconName;
      reachableIcons.add(iconName);
      fallbackIds.push(id);
    } else {
      unresolvedIds.push(id);
    }
  }

  const stale = Object.keys(languageIdAssociations).filter(
    (id) => !seenLanguageIds.has(id),
  );
  if (stale.length > 0) {
    console.warn(
      `note: ${stale.length} language id(s) in language-id-extensions.ts are not referenced by upstream languageIcons.ts (delete them): ${stale.join(", ")}`,
    );
  }
  if (shadowedResidualIds.length > 0) {
    console.warn(
      `note: ${shadowedResidualIds.length} language-id-extensions.ts entr(ies) are fully shadowed by explicit upstream entries or vscode-language-map.json (delete them): ${shadowedResidualIds.sort().join(", ")}`,
    );
  }
  if (fallbackIds.length > 0) {
    console.warn(
      `note: ${fallbackIds.length} upstream language id(s) have no association source; using the id itself as a file extension. Add them to language-id-extensions.ts or re-run 'bun run sync-vscode-languages': ${fallbackIds.sort().join(", ")}`,
    );
  }
  if (unresolvedIds.length > 0) {
    console.warn(
      `note: ${unresolvedIds.length} upstream language id(s) have no association source and their icon is only reachable via the languageId option: ${unresolvedIds.sort().join(", ")}`,
    );
  }

  return { fileNames, fileNamesWithPath, fileExtensions };
}

function buildLanguageIdMap(
  languageIcons: Array<{
    name: string;
    ids: string[];
    disabled?: boolean;
    enabledFor?: string[];
    clone?: unknown;
  }>,
): Record<string, string> {
  const languageIds: Record<string, string> = Object.create(null);
  for (const icon of languageIcons) {
    if (!isEnabled(icon)) continue;
    for (const id of icon.ids) {
      languageIds[id.toLowerCase()] = icon.name;
    }
  }
  return languageIds;
}

function buildFolderMaps(theme: {
  defaultIcon: { name: string };
  rootFolder?: { name: string };
  icons?: Array<{
    name: string;
    folderNames?: string[];
    rootFolderNames?: string[];
    disabled?: boolean;
    enabledFor?: string[];
  }>;
}) {
  const folderNames: Record<string, string> = Object.create(null);

  // The `specific` theme produces no `rootFolderNames` today and the runtime
  // does not consult them. We deliberately don't ship them — re-add the
  // collection here if a future theme starts using them.
  for (const icon of theme.icons ?? []) {
    if (!isEnabled(icon)) continue;
    for (const raw of icon.folderNames ?? []) {
      for (const v of folderNameVariants(raw)) {
        folderNames[v.toLowerCase()] = icon.name;
      }
    }
  }
  return { folderNames };
}

// Table packing ------------------------------------------------------------
//
// Each table is inverted to `name|keys` groups joined by `;`, where `keys` is
// the group's keys serialized as a brace-expansion trie
// (`webpack.{base.{cjs,js},cjs}`) and a key equal to `name` is written as the
// empty string. Folder tables additionally drop the shared `folder-` icon
// prefix and store only bases whose 5 `folderNameVariants` all map to the same
// icon. `src/packed.ts#unpack` reverses this at module load, and
// `assertRoundTrip` fails generation if the result drifts from the source.

const PACK_DELIMITERS = /[;|,{}]/;
const FOLDER_ICON_PREFIX = "folder-";

type TrieNode = Map<string, TrieNode>;

function braceTrie(keys: string[]): string {
  const root: TrieNode = new Map();
  for (const key of keys) {
    let node = root;
    for (const ch of key) {
      const next = node.get(ch) ?? new Map();
      node.set(ch, next);
      node = next;
    }
    node.set("", new Map());
  }
  const serialize = (node: TrieNode): string =>
    [...node]
      .map(([ch, child]) => {
        let head = ch;
        let cur = child;
        while (cur.size === 1 && !cur.has("")) {
          const [[c, next]] = [...cur] as [[string, TrieNode]];
          head += c;
          cur = next;
        }
        if (ch === "" || (cur.size === 1 && cur.has(""))) return head;
        return `${head}{${serialize(cur)}}`;
      })
      .join(",");
  return serialize(root);
}

function pack(table: Record<string, string>, iconPrefix = ""): string {
  const groups = new Map<string, string[]>();
  for (const [key, icon] of Object.entries(table)) {
    if (key === "" || PACK_DELIMITERS.test(key)) {
      throw new Error(`cannot pack key ${JSON.stringify(key)}`);
    }
    if (!icon.startsWith(iconPrefix) || PACK_DELIMITERS.test(icon)) {
      throw new Error(`cannot pack icon ${JSON.stringify(icon)}`);
    }
    const name = icon.slice(iconPrefix.length);
    const keys = groups.get(name) ?? [];
    keys.push(key === name ? "" : key);
    groups.set(name, keys);
  }
  return [...groups]
    .sort(([a], [b]) => (a < b ? -1 : 1))
    .map(([name, keys]) => `${name}|${braceTrie(keys.sort())}`)
    .join(";");
}

function assertRoundTrip(
  label: string,
  source: Record<string, string>,
  rebuilt: Record<string, string>,
): void {
  assert.deepStrictEqual(
    new Map(Object.entries(rebuilt)),
    new Map(Object.entries(source)),
    `${label}: packed table does not round-trip`,
  );
}

function serializeFileTable(
  exportName: string,
  table: Record<string, string>,
): string {
  const packed = pack(table);
  assertRoundTrip(exportName, table, unpack(packed));
  return `export const ${exportName} = unpack(\n\t${JSON.stringify(packed)},\n);\n`;
}

function serializeFolderNames(folderNames: Record<string, string>): string {
  const rest: Record<string, string> = Object.assign(
    Object.create(null),
    folderNames,
  );
  const bases: Record<string, string> = Object.create(null);
  for (const base of Object.keys(folderNames).sort()) {
    const icon = rest[base];
    if (icon === undefined) continue;
    const variants = folderNameVariants(base);
    if (!variants.every((v) => rest[v] === icon)) continue;
    for (const v of variants) delete rest[v];
    bases[base] = icon;
  }

  const packedBases = pack(bases, FOLDER_ICON_PREFIX);
  const packedRest = pack(rest, FOLDER_ICON_PREFIX);
  assertRoundTrip(
    "folderNames",
    folderNames,
    Object.assign(
      unpack(packedBases, FOLDER_ICON_PREFIX, FOLDER_VARIANTS),
      unpack(packedRest, FOLDER_ICON_PREFIX),
    ),
  );

  const prefix = JSON.stringify(FOLDER_ICON_PREFIX);
  const basesCall = `unpack(\n\t${JSON.stringify(packedBases)},\n\t${prefix},\n\t${JSON.stringify(FOLDER_VARIANTS)},\n)`;
  const restCall = `unpack(${JSON.stringify(packedRest)}, ${prefix})`;
  return `export const folderNames = ${
    packedRest
      ? `Object.assign(\n\t${basesCall},\n\t${restCall},\n)`
      : basesCall
  };\n`;
}

function gitHeadCommit(repo: string): string {
  try {
    // `^{commit}` peels annotated tags so we always record a commit SHA.
    return execSync("git rev-parse HEAD^{commit}", { cwd: repo })
      .toString()
      .trim();
  } catch {
    return "";
  }
}

async function main() {
  const root = resolve(import.meta.dirname, "..");
  const repoRaw = process.env.MATERIAL_ICON_THEME_REPO;
  const repo = repoRaw ? expandTilde(repoRaw) : resolve(root, SUBMODULE_PATH);

  if (!existsSync(resolve(repo, "package.json"))) {
    throw new Error(
      `upstream repo not found at ${repo}.\n` +
        (repoRaw
          ? "Check MATERIAL_ICON_THEME_REPO points at a valid clone of vscode-material-icon-theme."
          : `Run 'git submodule update --init --recursive' to fetch ${SUBMODULE_PATH}.`),
    );
  }

  const upstreamPkg = JSON.parse(
    readFileSync(resolve(repo, "package.json"), "utf8"),
  ) as { version: string };

  const upstreamCommit = gitHeadCommit(repo);
  console.log(
    `upstream repo: ${repo}, version: ${upstreamPkg.version}, commit: ${upstreamCommit.slice(0, 12)}`,
  );

  const [{ fileIcons }, { folderIcons }, { languageIcons }] =
    await loadUpstream(repo);

  const vscodeLanguageMap = JSON.parse(
    readFileSync(resolve(root, VSCODE_LANGUAGE_MAP_PATH), "utf8"),
  ) as VscodeLanguageMap;
  console.log(
    `vscode language map: tag ${vscodeLanguageMap.vscodeTag}, ${Object.keys(vscodeLanguageMap.languages).length} ids`,
  );

  const fileMaps = buildFileMaps(
    fileIcons,
    languageIcons,
    vscodeLanguageMap.languages,
  );
  const languageIds = buildLanguageIdMap(languageIcons);
  const theme = folderIcons.find((t) => t.name === FOLDER_THEME);
  if (!theme) throw new Error(`folder theme '${FOLDER_THEME}' not found`);
  const folderMaps = buildFolderMaps(theme);

  const generatedAt = new Date().toISOString();

  const header =
    "// AUTO-GENERATED by `bun run generate`. Do not edit by hand.\n" +
    `// upstream: material-icon-theme@${upstreamPkg.version}\n\n`;

  const importUnpack = 'import { unpack } from "../packed.ts";\n\n';

  const fileIconsTs =
    header +
    importUnpack +
    serializeFileTable("fileNames", fileMaps.fileNames) +
    serializeFileTable("fileNamesWithPath", fileMaps.fileNamesWithPath) +
    serializeFileTable("fileExtensions", fileMaps.fileExtensions) +
    serializeFileTable("languageIds", languageIds) +
    `export const defaultFile = ${JSON.stringify(fileIcons.defaultIcon.name)};\n`;

  const folderIconsTs =
    header +
    importUnpack +
    serializeFolderNames(folderMaps.folderNames) +
    `export const defaultFolder = ${JSON.stringify(theme.defaultIcon.name)};\n`;

  const metadataTs =
    header +
    "/**\n" +
    " * Provenance of the bundled icon lookup tables.\n" +
    " *\n" +
    " * `upstreamVersion` is also the default `version` used when building CDN\n" +
    " * URLs — it's the exact `material-icon-theme` release whose SVG inventory\n" +
    " * the lookup tables were generated against. Pinning to it (rather than\n" +
    " * `latest`) keeps resolved URLs and table entries in sync.\n" +
    " */\n" +
    "export const metadata = {\n" +
    `\t/** Upstream \`material-icon-theme\` release the tables were generated from. */\n` +
    `\tupstreamVersion: ${JSON.stringify(upstreamPkg.version)},\n` +
    `\t/** Full git commit SHA of the upstream release tag. */\n` +
    `\tupstreamCommit: ${JSON.stringify(upstreamCommit)},\n` +
    `\t/** Upstream GitHub repo, in \`owner/name\` form. */\n` +
    `\tupstreamRepo: ${JSON.stringify("material-extensions/vscode-material-icon-theme")},\n` +
    `\t/** ISO 8601 timestamp of when these tables were generated. */\n` +
    `\tgeneratedAt: ${JSON.stringify(generatedAt)},\n` +
    "} as const;\n";

  writeFileSync(resolve(root, "src/generated/file-icons.ts"), fileIconsTs);
  writeFileSync(resolve(root, "src/generated/folder-icons.ts"), folderIconsTs);
  writeFileSync(resolve(root, "src/generated/metadata.ts"), metadataTs);

  console.log(
    `fileNames=${Object.keys(fileMaps.fileNames).length} ` +
      `fileNamesWithPath=${Object.keys(fileMaps.fileNamesWithPath).length} ` +
      `fileExtensions=${Object.keys(fileMaps.fileExtensions).length} ` +
      `languageIds=${Object.keys(languageIds).length}`,
  );
  console.log(`folderNames=${Object.keys(folderMaps.folderNames).length}`);
  console.log("done");
}

void main();
