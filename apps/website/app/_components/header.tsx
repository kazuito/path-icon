import Link from "next/link";
import { metadata } from "path-icon";

export function Header() {
  return (
    <header className="flex items-center gap-3 h-12">
      <div className="flex items-baseline gap-2.5">
        <Link
          href="/"
          className="font-mono text-sm font-medium tracking-tight text-foreground"
        >
          path-icon
        </Link>
      </div>
      <div className="flex gap-4 font-mono ml-auto text-xs text-muted-foreground">
        <span>
          upstream{" "}
          <span className="text-foreground/80">{metadata.upstreamVersion}</span>
        </span>
      </div>
    </header>
  );
}
