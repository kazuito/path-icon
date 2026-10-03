import { describe, expect, it } from "bun:test";
import { getFileIcon, getFileIconByLanguageId } from "../src/file.ts";
import { getFolderIcon } from "../src/folder.ts";

describe("file-only resolver", () => {
  it("resolves file paths without folder options", () => {
    const r = getFileIcon("src/index.ts");
    expect(r).toMatchObject({
      name: "typescript",
      filename: "typescript.svg",
      type: "file",
      source: "fileExtensions",
    });
  });

  it("resolves language ids and custom base URLs", () => {
    expect(getFileIconByLanguageId("rust")?.name).toBe("rust");
    expect(getFileIcon("package.json")?.name).toBe("nodejs");
    expect(getFileIcon("index.ts", { baseUrl: "/icons" })?.url).toBe(
      "/icons/typescript.svg",
    );
  });

  it("supports file-only fallback modes", () => {
    expect(getFileIcon("zzz_no_such", { fallback: "none" })).toBeNull();
    expect(getFileIcon("zzz_no_such")?.name).toBe("file");
  });
});

describe("folder-only resolver", () => {
  it("resolves folder paths without file options", () => {
    const r = getFolderIcon("src", { open: true });
    expect(r).toMatchObject({
      name: "folder-src",
      filename: "folder-src-open.svg",
      type: "folder",
      source: "folderNames",
    });
  });

  it("resolves folder names and custom base URLs", () => {
    expect(getFolderIcon("node_modules")?.name).toBe("folder-node");
    expect(getFolderIcon("src", { baseUrl: "/icons" })?.url).toBe(
      "/icons/folder-src.svg",
    );
  });

  it("supports folder-only fallback modes", () => {
    expect(
      getFolderIcon("totally-unknown-folder-xyz", {
        fallback: "none",
      }),
    ).toBeNull();
    expect(getFolderIcon("totally-unknown-folder-xyz")?.name).toBe("folder");
  });
});
