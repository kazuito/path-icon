import { buildCdnUrl, joinBaseUrl } from "./cdn.ts";
import { metadata } from "./generated/metadata.ts";
import type { IconOptions, IconSource, IconType, PathIcon } from "./types.ts";

export type Hit = { name: string; source: IconSource };

type ResultOptions = Pick<IconOptions, "baseUrl" | "cdn" | "version">;

export function makeResult(
  hit: Hit,
  type: IconType,
  open: boolean,
  options: ResultOptions,
): PathIcon {
  const filename =
    type === "folder" && open ? `${hit.name}-open.svg` : `${hit.name}.svg`;
  const version = options.version ?? metadata.upstreamVersion;
  const url = options.baseUrl
    ? joinBaseUrl(options.baseUrl, filename)
    : buildCdnUrl({ cdn: options.cdn ?? "jsdelivr", version, filename });
  return { name: hit.name, filename, url, type, source: hit.source };
}
