import { describe, expect, it } from "bun:test";
import { metadata } from "../src/generated/metadata.ts";
import { getIcon, getIconByLanguageId } from "../src/index.ts";

describe("getIcon (file)", () => {
  it("matches exact filename (package.json → nodejs)", () => {
    const r = getIcon("package.json", { type: "file" });
    expect(r?.name).toBe("nodejs");
    expect(r?.source).toBe("fileNames");
    expect(r?.filename).toBe("nodejs.svg");
  });

  it("matches simple extension (.tsx → react_ts)", () => {
    const r = getIcon("src/app/page.tsx", { type: "file" });
    expect(r?.name).toBe("react_ts");
    expect(r?.source).toBe("fileExtensions");
  });

  it("prefers compound extension over simple (lib.d.ts)", () => {
    const r = getIcon("lib.d.ts", { type: "file" });
    expect(r?.source).toBe("fileExtensions");
    // upstream registers d.ts → typescript-def; bare ts → typescript
    expect(r?.name).not.toBe("typescript");
  });

  it("matches fileNamesWithPath when parent path matches (.github/FUNDING.yml)", () => {
    const r = getIcon(".github/FUNDING.yml", { type: "file" });
    expect(r?.source).toBe("fileNamesWithPath");
  });

  it("normalizes Windows separators and lowercase", () => {
    const r = getIcon("src\\app\\Page.TSX", { type: "file" });
    expect(r?.name).toBe("react_ts");
  });

  it("falls back to default file icon for truly unknown name", () => {
    const r = getIcon("totally-unknown-binary-blob-xyz", {
      type: "file",
    });
    expect(r?.source).toBe("default");
    expect(r?.name).toBe("file");
  });

  it("returns null when fallback=none and unmatched", () => {
    const r = getIcon("totally-unknown-binary-blob-xyz", {
      type: "file",
      fallback: "none",
    });
    expect(r).toBeNull();
  });

  it("resolves languageId-derived extensions (.yml → yaml, .js → javascript, .ts → typescript, .html → html)", () => {
    expect(getIcon("config.yml")?.name).toBe("yaml");
    expect(getIcon(".config/eza/theme.yml")?.name).toBe("yaml");
    expect(getIcon("app.yaml")?.name).toBe("yaml");
    expect(getIcon("index.js")?.name).toBe("javascript");
    expect(getIcon("index.ts")?.name).toBe("typescript");
    expect(getIcon("page.html")?.name).toBe("html");
    expect(getIcon("a.rb")?.name).toBe("ruby");
    expect(getIcon("a.swift")?.name).toBe("swift");
  });

  it("resolves associations from the VS Code built-in language map", () => {
    expect(getIcon(".bashrc")?.name).toBe("console");
    expect(getIcon(".vscodeignore")?.name).toBe("git");
    expect(getIcon("paper.sty")?.name).toBe("tex");
  });

  it("resolves associations from the residual language-id map", () => {
    expect(getIcon("application.yml")?.name).toBe("yaml");
    expect(getIcon("app.service")?.name).toBe("systemd");
    expect(getIcon("Chart.yaml")?.name).toBe("helm");
    expect(getIcon(".env")?.name).toBe("settings");
    expect(getIcon(".gitattributes")?.name).toBe("git");
  });

  it("resolves ids covered only by the id-as-extension fallback", () => {
    expect(getIcon("model.matlab")?.name).toBe("matlab");
  });

  it("uses languageId option as a fallback when path lookup misses", () => {
    const r = getIcon("foo.unknown-ext", { languageId: "rust" });
    expect(r?.name).toBe("rust");
    expect(r?.source).toBe("languageIds");
  });

  it("languageId option does not override path matches", () => {
    const r = getIcon("package.json", { languageId: "rust" });
    expect(r?.name).toBe("nodejs");
    expect(r?.source).toBe("fileNames");
  });

  it("languageId option is ignored for folder type", () => {
    const r = getIcon("foo.unknown-ext", {
      type: "folder",
      languageId: "rust",
      fallback: "none",
    });
    expect(r).toBeNull();
  });

  it("returns null when languageId option misses and fallback=none", () => {
    const r = getIcon("foo.unknown-ext", {
      languageId: "no-such-language-id-xyz",
      fallback: "none",
    });
    expect(r).toBeNull();
  });

  it("returns a fully populated PathIcon", () => {
    const r = getIcon("src/index.ts");
    expect(r).not.toBeNull();
    expect(r).toMatchObject({
      name: "typescript",
      filename: "typescript.svg",
      type: "file",
      source: "fileExtensions",
    });
    expect(r?.url).toContain("typescript.svg");
    expect(r?.url).toContain(`material-icon-theme@${metadata.upstreamVersion}`);
  });

  it("handles paths with query strings", () => {
    const r = getIcon("https://example.com/foo.ts?download=1");
    expect(r?.name).toBe("typescript");
  });

  it("handles paths with hash fragments", () => {
    const r = getIcon("foo.ts#L42");
    expect(r?.name).toBe("typescript");
  });

  it("ignores trailing slash on file paths", () => {
    const r = getIcon("foo.ts/", { fallback: "none" });
    // Trailing slash is stripped, so basename becomes "foo.ts" and resolves.
    expect(r?.name).toBe("typescript");
  });

  it("handles deeply nested paths for fileNamesWithPath lookup", () => {
    // fileNamesWithPath keys are exactly "parent/basename" — deeper paths
    // must still match on the immediate parent.
    const r = getIcon("repo/.github/FUNDING.yml");
    expect(r?.source).toBe("fileNamesWithPath");
  });

  it("prefers longest compound extension over shorter", () => {
    // .test.tsx is upstream-registered (mocha/jest test), and longer than .tsx
    const r = getIcon("page.test.tsx");
    expect(r?.source).toBe("fileExtensions");
    expect(r?.name).not.toBe("react_ts");
  });

  it("returns default when given an empty path", () => {
    const r = getIcon("");
    expect(r?.source).toBe("default");
    expect(r?.name).toBe("file");
  });

  it("returns null for empty path with fallback=none", () => {
    const r = getIcon("", { fallback: "none" });
    expect(r).toBeNull();
  });

  it("fallback='folder' on a missed file returns folder default", () => {
    const r = getIcon("zzz_no_such_file_xyz", {
      type: "file",
      fallback: "folder",
    });
    expect(r?.type).toBe("folder");
    expect(r?.source).toBe("default");
    expect(r?.name).toBe("folder");
  });

  it("resolves upstream-misregistered dotted entries (.ncurc.js → dependencies-update)", () => {
    // Upstream lists `.ncurc.*` under fileExtensions even though they are full
    // filenames; the generator routes them to fileNames so they actually match.
    const r = getIcon(".ncurc.js");
    expect(r?.source).toBe("fileNames");
    expect(r?.name).toBe("dependencies-update");
  });

  it("treats path with no extension correctly", () => {
    // LICENSE has no extension and no upstream entry by default → fallback
    const r = getIcon("README", {
      type: "file",
      fallback: "none",
    });
    // readme is a fileName in upstream, so this would resolve. Use a safer
    // non-existent name to assert null.
    // Switching to a guaranteed unknown:
    void r;
    const r2 = getIcon("zzz_no_such_file_name", {
      type: "file",
      fallback: "none",
    });
    expect(r2).toBeNull();
  });
});

describe("getIconByLanguageId", () => {
  it("resolves common language ids", () => {
    expect(getIconByLanguageId("typescript")?.name).toBe("typescript");
    expect(getIconByLanguageId("rust")?.name).toBe("rust");
    expect(getIconByLanguageId("python")?.name).toBe("python");
  });

  it("uses languageIds source", () => {
    const r = getIconByLanguageId("go");
    expect(r?.source).toBe("languageIds");
    expect(r?.filename).toBe("go.svg");
  });

  it("is case-insensitive", () => {
    expect(getIconByLanguageId("TypeScript")?.name).toBe("typescript");
  });

  it("falls back to default file icon for unknown ids", () => {
    const r = getIconByLanguageId("no-such-language-id-xyz");
    expect(r?.source).toBe("default");
    expect(r?.name).toBe("file");
  });

  it("returns null with fallback=none when unmatched", () => {
    const r = getIconByLanguageId("no-such-language-id-xyz", {
      fallback: "none",
    });
    expect(r).toBeNull();
  });

  it("always returns type='file' on hit", () => {
    const r = getIconByLanguageId("rust");
    expect(r?.type).toBe("file");
  });

  it("filename always includes .svg extension", () => {
    const r = getIconByLanguageId("python");
    expect(r?.filename).toBe("python.svg");
  });

  it("respects cdn option for url", () => {
    const r = getIconByLanguageId("rust", {
      cdn: "unpkg",
      version: "5.34.0",
    });
    expect(r?.url).toBe(
      "https://unpkg.com/material-icon-theme@5.34.0/icons/rust.svg",
    );
  });

  it("respects baseUrl option", () => {
    const r = getIconByLanguageId("rust", {
      baseUrl: "/assets/icons/",
    });
    expect(r?.url).toBe("/assets/icons/rust.svg");
  });

  it("fallback='folder' returns folder default on miss", () => {
    const r = getIconByLanguageId("no-such-language-id-xyz", {
      fallback: "folder",
    });
    expect(r?.type).toBe("folder");
    expect(r?.name).toBe("folder");
    expect(r?.source).toBe("default");
  });

  it("returns empty-string id as a miss", () => {
    const r = getIconByLanguageId("", { fallback: "none" });
    expect(r).toBeNull();
  });
});
