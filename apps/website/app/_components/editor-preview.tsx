import { resolveMaterialIcon } from "path-icon";
import { cn } from "@/lib/utils";
import { Code } from "./code";

const ACTIVE_FILE = "src/components/file-icon.tsx";

const TREE: { path: string; folder?: boolean; open?: boolean }[] = [
  { path: ".github", folder: true, open: true },
  { path: ".github/workflows", folder: true, open: true },
  { path: ".github/workflows/ci.yml" },
  { path: "node_modules", folder: true },
  { path: "public", folder: true },
  { path: "src", folder: true, open: true },
  { path: "src/components", folder: true, open: true },
  { path: "src/components/file-icon.tsx" },
  { path: "src/lib", folder: true },
  { path: "src/app.test.ts" },
  { path: "src/index.ts" },
  { path: ".env" },
  { path: ".gitignore" },
  { path: "biome.json" },
  { path: "Dockerfile" },
  { path: "LICENSE" },
  { path: "package.json" },
  { path: "pnpm-lock.yaml" },
  { path: "README.md" },
  { path: "tsconfig.json" },
  { path: "vite.config.ts" },
];

const TABS = [ACTIVE_FILE, "src/index.ts", "package.json", "vite.config.ts"];

const SOURCE = `import { resolveMaterialIcon } from "path-icon";

export function FileIcon({ path }: { path: string }) {
  const { cdnUrl, name } = resolveMaterialIcon(path);
  return <img src={cdnUrl} alt={name} width={16} height={16} />;
}`;

const basename = (path: string) => path.slice(path.lastIndexOf("/") + 1);

function Icon({
  path,
  folder,
  open,
}: {
  path: string;
  folder?: boolean;
  open?: boolean;
}) {
  const icon = resolveMaterialIcon(path, {
    type: folder ? "folder" : "file",
    open,
  });
  if (!icon) return null;
  return (
    // biome-ignore lint/performance/noImgElement: external CDN, no Next optimizer needed
    <img src={icon.cdnUrl} alt="" loading="lazy" className="size-4 shrink-0" />
  );
}

export function EditorPreview() {
  return (
    <div className="overflow-hidden rounded-lg border border-border bg-card/40 text-[13px]">
      <div className="grid sm:grid-cols-[13rem_1fr]">
        <ul className="border-b border-border py-2 sm:border-e sm:border-b-0">
          <li className="px-4 pb-2 text-xs font-medium tracking-wide text-muted-foreground uppercase">
            Explorer
          </li>
          {TREE.map(({ path, folder, open }) => (
            <li
              key={path}
              className={cn(
                "flex items-center gap-1.5 py-0.5 pe-3",
                path === ACTIVE_FILE && "bg-foreground/10",
              )}
              style={{
                paddingInlineStart: `${path.split("/").length * 0.75 + 0.25}rem`,
              }}
            >
              <Icon path={path} folder={folder} open={open} />
              <span className="truncate">{basename(path)}</span>
            </li>
          ))}
        </ul>

        <div className="min-w-0">
          <div className="flex overflow-x-auto border-b border-border">
            {TABS.map((path) => (
              <div
                key={path}
                className={cn(
                  "flex shrink-0 items-center gap-1.5 border-e border-border px-3 py-2",
                  path === ACTIVE_FILE
                    ? "bg-background/60"
                    : "text-muted-foreground",
                )}
              >
                <Icon path={path} />
                {basename(path)}
              </div>
            ))}
          </div>
          <div className="flex items-center gap-1 px-4 py-1.5 text-xs text-muted-foreground">
            {ACTIVE_FILE.split("/").join(" › ")}
          </div>
          <pre className="overflow-x-auto px-4 pb-4 font-mono leading-relaxed">
            <Code code={SOURCE} />
          </pre>
        </div>
      </div>
    </div>
  );
}
