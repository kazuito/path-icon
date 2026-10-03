import { describe, expect, it } from "bun:test";
import { fileNames } from "../src/generated/file-icons.ts";
import { folderNames } from "../src/generated/folder-icons.ts";
import { expandBraces, unpack } from "../src/packed.ts";

describe("packed tables", () => {
  it("expands nested brace patterns", () => {
    expect(expandBraces("x{y,z{,1}},w")).toEqual(["xy", "xz", "xz1", "w"]);
  });

  it("maps an empty key to the group name and applies prefix + variants", () => {
    expect({ ...unpack("a|,b{1,2};c|d") }).toEqual({
      a: "a",
      b1: "a",
      b2: "a",
      d: "c",
    });
    expect({
      ...unpack("x|,y", "p-", [
        ["", ""],
        ["_", "_"],
      ]),
    }).toEqual({
      x: "p-x",
      _x_: "p-x",
      y: "p-x",
      _y_: "p-x",
    });
  });

  it("does not leak Object.prototype members as icon names", () => {
    expect(fileNames.constructor).toBeUndefined();
    expect(Object.entries(folderNames)).toContainEqual([
      "__proto__",
      "folder-proto",
    ]);
  });
});
