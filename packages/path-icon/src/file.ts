import {
  defaultFile,
  fileExtensions,
  fileNames,
  fileNamesWithPath,
  languageIds,
} from "./generated/file-icons.ts";
import {
  getBasename,
  getExtensionCandidates,
  getParentName,
  normalizePath,
} from "./normalize.ts";
import { type Hit, makeResult } from "./result.ts";
import type {
  FallbackMode,
  IconOptions,
  LanguageIdOptions,
  PathIcon,
} from "./types.ts";

export type FileIconOptions = Omit<
  IconOptions,
  "fallback" | "open" | "type"
> & {
  /**
   * What to return when no file icon matches the input.
   *
   * File-only imports intentionally do not load folder lookup tables, so the
   * file entry supports only file fallback or `null`.
   *
   * @default "file"
   */
  fallback?: Extract<FallbackMode, "file" | "none">;
};

export type FileLanguageIdOptions = Omit<LanguageIdOptions, "fallback"> & {
  /**
   * What to return when no language id matches the input.
   *
   * @default "file"
   */
  fallback?: Extract<FallbackMode, "file" | "none">;
};

function lookupFile(path: string): Hit | null {
  const normalized = normalizePath(path);
  const basename = getBasename(normalized).toLowerCase();
  const parent = getParentName(normalized).toLowerCase();

  if (parent.length > 0) {
    const key = `${parent}/${basename}`;
    const hit = fileNamesWithPath[key];
    if (hit) return { name: hit, source: "fileNamesWithPath" };
  }

  const nameHit = fileNames[basename];
  if (nameHit) return { name: nameHit, source: "fileNames" };

  for (const ext of getExtensionCandidates(basename)) {
    const extHit = fileExtensions[ext];
    if (extHit) return { name: extHit, source: "fileExtensions" };
  }

  return null;
}

function lookupLanguageId(languageId: string): Hit | null {
  const hit = languageIds[languageId.toLowerCase()];
  return hit ? { name: hit, source: "languageIds" } : null;
}

/**
 * Resolve a Material Icon Theme file icon from a file path.
 *
 * This entry only imports file icon lookup data. Use
 * `path-icon/folder` for folder-only resolution, or the root
 * entry for the combined resolver.
 */
export function getFileIcon(
  path: string,
  options?: FileIconOptions,
): PathIcon | null {
  const opts = options ?? {};
  let hit = lookupFile(path);

  if (!hit && opts.languageId) {
    hit = lookupLanguageId(opts.languageId);
  }

  if (hit) return makeResult(hit, "file", false, opts);

  const fallback = opts.fallback ?? "file";
  if (fallback === "none") return null;

  return makeResult(
    { name: defaultFile, source: "default" },
    "file",
    false,
    opts,
  );
}

/**
 * Resolve a Material Icon Theme file icon directly from a VS Code language id.
 */
export function getFileIconByLanguageId(
  languageId: string,
  options?: FileLanguageIdOptions,
): PathIcon | null {
  const opts = options ?? {};
  const hit = lookupLanguageId(languageId);

  if (hit) return makeResult(hit, "file", false, opts);

  const fallback = opts.fallback ?? "file";
  if (fallback === "none") return null;

  return makeResult(
    { name: defaultFile, source: "default" },
    "file",
    false,
    opts,
  );
}
