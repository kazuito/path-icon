import Link from "next/link";
import { siteConfig } from "@/lib/site";
import { InstallCommand } from "./_components/install-command";

const NPM_URL = siteConfig.npm;
const REPO_URL = siteConfig.repo;

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
    </main>
  );
}
