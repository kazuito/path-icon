import { getFileIcon, getFileIconByLanguageId } from "./file.ts";
import { getFolderIcon } from "./folder.ts";
import type { IconOptions, LanguageIdOptions, PathIcon } from "./types.ts";

/**
 * Resolve a Material Icon Theme icon from a file or folder path.
 *
 * Returns the matching {@link PathIcon}, or `null` only when
 * `options.fallback` is `"none"` and nothing matched. With the default
 * `fallback`, a default file or folder icon is always returned.
 *
 * Resolution order (case-insensitive):
 *
 * - **Files** — `parent/basename` exact → `basename` exact → longest known
 *   extension → {@link IconOptions.languageId} (when provided)
 *   → fallback.
 * - **Folders** — root folder name → generic folder name → fallback. The
 *   `-open` suffix is appended to the SVG filename when
 *   {@link IconOptions.open} is `true`.
 *
 * @param path - File or folder path. Both POSIX and Windows separators are accepted.
 * @param options - See {@link IconOptions}.
 *
 * @example
 * ```ts
 * getIcon("src/index.ts");
 * // {
 * //   name: "typescript",
 * //   filename: "typescript.svg",
 * //   url: "https://cdn.jsdelivr.net/npm/material-icon-theme@5.39.0/icons/typescript.svg",
 * //   type: "file",
 * //   source: "fileExtensions",
 * // }
 *
 * getIcon("src", { type: "folder", open: true });
 * // { name: "folder-src", filename: "folder-src-open.svg", ... }
 *
 * getIcon("scratch.unknown-ext", { languageId: "rust" });
 * // → rust (path miss, languageId wins)
 *
 * getIcon("anything.weird", { fallback: "none" });
 * // null
 * ```
 */
export function getIcon(path: string, options?: IconOptions): PathIcon | null {
  const opts = options ?? {};
  const type = opts.type ?? "file";
  const open = opts.open ?? false;

  const hit =
    type === "file"
      ? getFileIcon(path, { ...opts, fallback: "none" })
      : getFolderIcon(path, { ...opts, fallback: "none" });
  if (hit) return hit;

  const fallback = opts.fallback ?? type;
  if (fallback === "none") return null;

  if (fallback === "file") {
    return getFileIcon("", {
      ...opts,
      fallback: "file",
      languageId: undefined,
    });
  }

  return getFolderIcon("", { ...opts, fallback: "folder", open });
}

/**
 * Resolve a Material Icon Theme icon directly from a VS Code
 * [language id](https://code.visualstudio.com/docs/languages/identifiers).
 *
 * Useful when you already have a language identifier in hand (e.g. from a
 * Monaco editor model) and the file path may be synthetic or unhelpful.
 *
 * Returns a {@link PathIcon} with `type: "file"`, or `null` only
 * when `options.fallback` is `"none"` and the language id has no associated
 * icon. With the default `fallback`, the default file icon is returned.
 *
 * @param languageId - VS Code language id (e.g. `"typescript"`, `"rust"`, `"shellscript"`). Matched case-insensitively.
 * @param options - See {@link LanguageIdOptions}.
 *
 * @example
 * ```ts
 * getIconByLanguageId("rust");
 * // { name: "rust", filename: "rust.svg", ..., source: "languageIds" }
 *
 * getIconByLanguageId("plaintext", { fallback: "none" });
 * // null
 * ```
 */
export function getIconByLanguageId(
  languageId: string,
  options?: LanguageIdOptions,
): PathIcon | null {
  const opts = options ?? {};
  const hit = getFileIconByLanguageId(languageId, {
    ...opts,
    fallback: "none",
  });
  if (hit) return hit;

  const fallback = opts.fallback ?? "file";
  if (fallback === "none") return null;

  if (fallback === "folder") {
    return getFolderIcon("", { ...opts, fallback: "folder" });
  }

  return getFileIconByLanguageId("", { ...opts, fallback: "file" });
}
