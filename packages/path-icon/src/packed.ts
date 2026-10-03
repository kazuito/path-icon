/**
 * Expands an icon table packed by `scripts/generate.ts`.
 *
 * `packed` is a `;`-separated list of `name|keys` groups. `keys` is a brace
 * pattern (`webpack.{cjs,js}`, `json{,5,c}`), and an empty key stands for
 * `name` itself. Every key maps to `iconPrefix + name`; each key is emitted
 * once per `[prefix, suffix]` pair in `variants`.
 */
export function unpack(
  packed: string,
  iconPrefix = "",
  variants: ReadonlyArray<readonly [string, string]> = [["", ""]],
): Record<string, string> {
  const out: Record<string, string> = Object.create(null);
  for (const group of packed ? packed.split(";") : []) {
    const bar = group.indexOf("|");
    const name = group.slice(0, bar);
    for (const key of expandBraces(group.slice(bar + 1))) {
      for (const [pre, suf] of variants) {
        out[pre + (key || name) + suf] = iconPrefix + name;
      }
    }
  }
  return out;
}

export function expandBraces(pattern: string): string[] {
  let i = 0;
  const list = (): string[] => {
    const out: string[] = [];
    do {
      const start = i;
      while (i < pattern.length && !",{}".includes(pattern.charAt(i))) i++;
      const head = pattern.slice(start, i);
      if (pattern.charAt(i) === "{") {
        i++;
        for (const tail of list()) out.push(head + tail);
      } else {
        out.push(head);
      }
    } while (pattern.charAt(i++) === ",");
    return out;
  };
  return list();
}
