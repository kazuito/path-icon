import type { Metadata } from "next";
import { Suspense } from "react";
import { IconResolver } from "@/app/_components/icon-resolver";
import { siteConfig } from "@/lib/site";

const PLAYGROUND_TITLE = "Online playground";
const PLAYGROUND_DESCRIPTION =
  "Paste file or folder paths and instantly see which Material Icon Theme icon each one resolves to. Switch CDN, fallback strategy, version, and open-folder mode in real time.";

export const metadata: Metadata = {
  title: PLAYGROUND_TITLE,
  description: PLAYGROUND_DESCRIPTION,
  alternates: { canonical: "/playground" },
  openGraph: {
    type: "website",
    url: "/playground",
    siteName: siteConfig.name,
    title: `${PLAYGROUND_TITLE} — ${siteConfig.name}`,
    description: PLAYGROUND_DESCRIPTION,
    images: [
      {
        url: siteConfig.ogImage,
        width: 1200,
        height: 630,
        alt: `${siteConfig.name} — ${PLAYGROUND_TITLE}`,
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: `${PLAYGROUND_TITLE} — ${siteConfig.name}`,
    description: PLAYGROUND_DESCRIPTION,
    images: [siteConfig.ogImage],
  },
};

export default function PlaygroundPage() {
  return (
    <main className="mx-auto w-full max-w-7xl px-5 sm:px-6">
      <h1 className="sr-only">path-icon — interactive online playground</h1>
      <Suspense>
        <IconResolver />
      </Suspense>
    </main>
  );
}
