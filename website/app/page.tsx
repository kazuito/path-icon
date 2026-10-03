import {
  type ResolvedMaterialIcon,
  resolveMaterialIcon,
  resolveMaterialIconByLanguageId,
} from "material-icon-resolver";
import Link from "next/link";
import { siteConfig } from "@/lib/site";
import { Code } from "./_components/code";
import { InstallCommand } from "./_components/install-command";

const NPM_URL = siteConfig.npm;
const REPO_URL = siteConfig.repo;

const USAGE = `import { resolveMaterialIcon } from "material-icon-resolver";

const icon = resolveMaterialIcon("src/index.ts");
// icon.name     → "typescript"
// icon.filename → "typescript.svg"
// icon.cdnUrl   → "https://cdn.jsdelivr.net/.../icons/typescript.svg"
// icon.source   → "fileExtensions"`;

const EXAMPLES: { call: string; result: ResolvedMaterialIcon | null }[] = [
  {
    call: 'resolveMaterialIcon("src/index.ts")',
    result: resolveMaterialIcon("src/index.ts"),
  },
  {
    call: 'resolveMaterialIcon("package.json")',
    result: resolveMaterialIcon("package.json"),
  },
  {
    call: 'resolveMaterialIcon("src/app.test.ts")',
    result: resolveMaterialIcon("src/app.test.ts"),
  },
  {
    call: 'resolveMaterialIcon("src", { type: "folder" })',
    result: resolveMaterialIcon("src", { type: "folder" }),
  },
  {
    call: 'resolveMaterialIcon("src", { type: "folder", open: true })',
    result: resolveMaterialIcon("src", { type: "folder", open: true }),
  },
  {
    call: 'resolveMaterialIconByLanguageId("rust")',
    result: resolveMaterialIconByLanguageId("rust"),
  },
];

const API: { signature: string; returns?: string; description: string }[] = [
  {
    signature: "resolveMaterialIcon(path, options?)",
    returns: "ResolvedMaterialIcon | null",
    description:
      "Resolve a file or folder path to its icon name, SVG filename, CDN URL, and match source.",
  },
  {
    signature: "resolveMaterialIconByLanguageId(languageId, options?)",
    returns: "ResolvedMaterialIcon | null",
    description:
      "Resolve from a VS Code language ID such as rust or shellscript.",
  },
  {
    signature: "getMaterialIconName(path, options?)",
    returns: "string | null",
    description: "Return only the icon name.",
  },
  {
    signature: "getMaterialIconCdnUrl(path, options?)",
    returns: "string | null",
    description: "Return only the SVG URL.",
  },
  {
    signature:
      'import { resolveMaterialFileIcon } from "material-icon-resolver/file";',
    description:
      "Split entries load only the file or folder tables. /folder exports resolveMaterialFolderIcon.",
  },
];

const OPTIONS: {
  name: string;
  type: string;
  defaultValue?: string;
  description: string;
}[] = [
  {
    name: "type",
    type: '"file" | "folder"',
    defaultValue: '"file"',
    description: "Resolve the path as a file or a folder.",
  },
  {
    name: "open",
    type: "boolean",
    defaultValue: "false",
    description: "Use the expanded folder icon (folder-*-open.svg).",
  },
  {
    name: "languageId",
    type: "string",
    description: "VS Code language ID used when the path matches nothing.",
  },
  {
    name: "fallback",
    type: '"file" | "folder" | "none"',
    defaultValue: "options.type",
    description: 'What to return on no match. "none" returns null.',
  },
  {
    name: "cdn",
    type: '"jsdelivr" | "unpkg"',
    defaultValue: '"jsdelivr"',
    description: "CDN used to build cdnUrl.",
  },
  {
    name: "version",
    type: "string",
    defaultValue: "metadata.upstreamVersion",
    description: "material-icon-theme version in the CDN URL.",
  },
  {
    name: "baseUrl",
    type: "string",
    description: "Self-hosted icon base URL. Overrides cdn and version.",
  },
];

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="mt-14 space-y-4">
      <h2 className="text-sm font-medium text-muted-foreground">{title}</h2>
      {children}
    </section>
  );
}

export default function Home() {
  return (
    <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col justify-center px-5 py-16 sm:px-6">
      <div>
        <div className="space-y-5">
          <h1 className="font-medium tracking-tight text-foreground text-xl">
            Material Icon Resolver
          </h1>
          <p className="max-w-xl text-base leading-relaxed">
            npm library that resolves Material Icon Theme icon names, filenames,
            and CDN URLs from a file path, folder path, or language ID.
          </p>
        </div>

        <div className="space-y-1.5 font-mono text-sm mt-6">
          <InstallCommand cmd="npm i material-icon-resolver" />
        </div>

        <div className="flex flex-wrap items-center gap-6 mt-6 *:text-sm *:text-muted-foreground *:hover:underline">
          <Link href="/try">Playground</Link>
          <Link
            href={NPM_URL}
            target="_blank"
            rel="noreferrer noopener"
            aria-label="npm"
          >
            npm
          </Link>
          <Link
            href={REPO_URL}
            target="_blank"
            rel="noreferrer noopener"
            aria-label="GitHub repository"
          >
            GitHub
          </Link>
        </div>
      </div>

      <Section title="Usage">
        <pre className="overflow-x-auto scrollbar-none rounded-lg border border-border bg-card/40 p-4 font-mono text-sm leading-relaxed">
          <Code code={USAGE} />
        </pre>
      </Section>

      <Section title="Examples">
        <ul className="divide-y divide-border rounded-lg border border-border bg-card/40 font-mono text-sm">
          {EXAMPLES.map(({ call, result }) => (
            <li
              key={call}
              className="flex flex-col gap-1 px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4"
            >
              <Code code={call} className="truncate" />
              {result && (
                <span className="flex shrink-0 items-center gap-2 text-muted-foreground">
                  {/* biome-ignore lint/performance/noImgElement: external CDN, no Next optimizer needed */}
                  <img
                    src={result.cdnUrl}
                    alt=""
                    loading="lazy"
                    className="size-4"
                  />
                  {result.filename}
                </span>
              )}
            </li>
          ))}
        </ul>
      </Section>

      <Section title="API">
        <ul className="divide-y divide-border rounded-lg border border-border bg-card/40">
          {API.map(({ signature, returns, description }) => (
            <li key={signature} className="space-y-1.5 px-4 py-3">
              <div className="flex flex-col gap-1 font-mono text-sm sm:flex-row sm:items-baseline sm:justify-between sm:gap-4">
                <Code code={signature} className="truncate" />
                {returns && (
                  <span className="shrink-0 text-xs text-muted-foreground">
                    → {returns}
                  </span>
                )}
              </div>
              <p className="text-sm text-muted-foreground">{description}</p>
            </li>
          ))}
        </ul>
      </Section>

      <Section title="Options">
        <ul className="divide-y divide-border rounded-lg border border-border bg-card/40">
          {OPTIONS.map(({ name, type, defaultValue, description }) => (
            <li
              key={name}
              className="grid gap-x-6 gap-y-1 px-4 py-3 sm:grid-cols-[7rem_1fr]"
            >
              <code className="font-mono text-sm">{name}</code>
              <div className="space-y-1">
                <p className="text-sm text-foreground/80">{description}</p>
                <p className="flex flex-wrap gap-x-4 gap-y-1 font-mono text-xs text-muted-foreground">
                  <Code code={type} />
                  {defaultValue && (
                    <span>
                      default <Code code={defaultValue} />
                    </span>
                  )}
                </p>
              </div>
            </li>
          ))}
        </ul>
        <p className="text-sm text-muted-foreground">
          Full reference in the{" "}
          <Link
            href={`${REPO_URL}#readme`}
            target="_blank"
            rel="noreferrer noopener"
            className="underline"
          >
            README
          </Link>
          .
        </p>
      </Section>
    </main>
  );
}
