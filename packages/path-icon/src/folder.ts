import { defaultFolder, folderNames } from "./generated/folder-icons.ts";
import { getBasename, normalizePath } from "./normalize.ts";
import { type Hit, makeResult } from "./result.ts";
import type { FallbackMode, IconOptions, PathIcon } from "./types.ts";

export type FolderIconOptions = Omit<
  IconOptions,
  "fallback" | "languageId" | "type"
> & {
  /**
   * What to return when no folder icon matches the input.
   *
   * Folder-only imports intentionally do not load file lookup tables, so the
   * folder entry supports only folder fallback or `null`.
   *
   * @default "folder"
   */
  fallback?: Extract<FallbackMode, "folder" | "none">;
};

function lookupFolder(path: string): Hit | null {
  const normalized = normalizePath(path);
  const basename = getBasename(normalized).toLowerCase();
  if (basename.length === 0) return null;

  // The `-open` suffix is appended to the SVG filename in `makeResult`, so the
  // icon name itself is the same whether the folder is open or closed — we
  // only need a single lookup table.
  const folderHit = folderNames[basename];
  if (folderHit) return { name: folderHit, source: "folderNames" };

  return null;
}

/**
 * Resolve a Material Icon Theme folder icon from a folder path.
 *
 * This entry only imports folder icon lookup data. Use
 * `path-icon/file` for file-only resolution, or the root entry
 * for the combined resolver.
 */
export function getFolderIcon(
  path: string,
  options?: FolderIconOptions,
): PathIcon | null {
  const opts = options ?? {};
  const open = opts.open ?? false;
  const hit = lookupFolder(path);

  if (hit) return makeResult(hit, "folder", open, opts);

  const fallback = opts.fallback ?? "folder";
  if (fallback === "none") return null;

  return makeResult(
    { name: defaultFolder, source: "default" },
    "folder",
    open,
    opts,
  );
}
