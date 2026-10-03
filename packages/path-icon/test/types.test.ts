import { describe, expect, it } from "bun:test";
import {
  getFileIcon,
  getFileIconByLanguageId,
  getFolderIcon,
  getIcon,
  getIconByLanguageId,
  type IconOptions,
  type PathIcon,
} from "../src/index.ts";

describe("return type narrowing", () => {
  it("returns PathIcon without null when fallback is not none", () => {
    const icons: PathIcon[] = [
      getIcon("a.ts"),
      getIcon("src", { isFolder: true, open: true }),
      getIcon("a.ts", { fallback: "folder" }),
      getFileIcon("a.ts"),
      getFolderIcon("src"),
      getFileIconByLanguageId("rust"),
      getIconByLanguageId("rust", { fallback: "file" }),
    ];
    expect(icons.every((icon) => icon !== null)).toBe(true);
  });

  it("keeps null in the return type when fallback may be none", () => {
    const options: IconOptions = {};
    // @ts-expect-error fallback: "none" can return null
    const none: PathIcon = getIcon("zzz_no_such", { fallback: "none" });
    // @ts-expect-error a widened fallback can be "none"
    const widened: PathIcon = getIcon("a.ts", options);
    // @ts-expect-error fallback: "none" can return null
    const language: PathIcon = getIconByLanguageId("x", { fallback: "none" });
    expect(none).toBeNull();
    expect(widened).not.toBeNull();
    expect(language).toBeNull();
  });

  it("rejects fallback: folder for language ids", () => {
    // @ts-expect-error language-id resolution has no folder fallback
    getIconByLanguageId("x", { fallback: "folder" });
  });
});
