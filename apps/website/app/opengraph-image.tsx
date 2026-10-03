import { ImageResponse } from "next/og";
import { getIcon, type IconOptions, metadata } from "path-icon";
import { siteConfig } from "@/lib/site";

export const alt = `${siteConfig.name} — ${siteConfig.tagline}`;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const LIME = "#b6f045";
const FG = "#fafafa";
const MUTED = "rgba(250, 250, 250, 0.55)";
const SUBTLE = "rgba(250, 250, 250, 0.35)";

const SAMPLES: { path: string; options?: IconOptions }[] = [
  { path: "src/index.ts" },
  { path: "app/page.tsx" },
  { path: "package.json" },
  { path: "Dockerfile" },
  { path: "vite.config.ts" },
  { path: "README.md" },
  { path: ".github", options: { isFolder: true } },
  { path: "components", options: { isFolder: true, open: true } },
];

const ASCII = String.fromCharCode(
  ...Array.from({ length: 95 }, (_, i) => i + 32),
);

async function loadGeistMono(weight: number): Promise<ArrayBuffer> {
  const css = await fetch(
    `https://fonts.googleapis.com/css2?family=Geist+Mono:wght@${weight}&text=${encodeURIComponent(ASCII)}`,
  ).then((res) => res.text());
  const url = css.match(
    /src: url\((.+?)\) format\('(?:opentype|truetype)'\)/,
  )?.[1];
  if (!url) throw new Error(`Geist Mono ${weight} not found`);
  return fetch(url).then((res) => res.arrayBuffer());
}

export default async function OpengraphImage() {
  const [regular, semibold] = await Promise.all([
    loadGeistMono(400),
    loadGeistMono(600),
  ]);

  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        gap: 56,
        padding: "64px 72px",
        background:
          "radial-gradient(circle at 85% 10%, rgba(182, 240, 69, 0.12) 0%, rgba(10, 10, 10, 0) 45%), #0a0a0a",
        color: FG,
        fontFamily: "Geist Mono",
      }}
    >
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          flex: 1,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <svg width="48" height="48" viewBox="0 0 64 64" aria-hidden="true">
            <rect width="64" height="64" rx="14" fill="#1a1a1a" />
            <path
              d="M18 9h19l12 12v31a3 3 0 0 1-3 3H18a3 3 0 0 1-3-3V12a3 3 0 0 1 3-3z"
              fill={LIME}
            />
            <path d="M37 9v9a3 3 0 0 0 3 3h9z" fill="#6c9420" />
            <path
              d="M22 37h15m-6-6 6 6-6 6"
              fill="none"
              stroke="#0a0a0a"
              strokeWidth="4.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          <span style={{ fontSize: 34, fontWeight: 600 }}>path-icon</span>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
          <div
            style={{
              fontSize: 54,
              fontWeight: 600,
              lineHeight: 1.1,
              letterSpacing: "-0.03em",
            }}
          >
            The right icon for every path.
          </div>
          <div style={{ fontSize: 24, lineHeight: 1.45, color: MUTED }}>
            Material Icon Theme names, filenames, and CDN URLs from any file
            path, folder path, or language id.
          </div>
        </div>

        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 10,
            fontSize: 22,
          }}
        >
          <span style={{ color: LIME }}>$ npm i path-icon</span>
          <span style={{ color: SUBTLE }}>
            {siteConfig.url.replace(/^https?:\/\//, "")}
          </span>
        </div>
      </div>

      <div
        style={{
          display: "flex",
          flexDirection: "column",
          width: 500,
          padding: "24px 28px",
          gap: 18,
          borderRadius: 20,
          border: "1px solid rgba(250, 250, 250, 0.1)",
          background: "rgba(250, 250, 250, 0.03)",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            fontSize: 18,
            color: SUBTLE,
            paddingBottom: 14,
            borderBottom: "1px solid rgba(250, 250, 250, 0.08)",
          }}
        >
          <span>getIcon(path)</span>
          <span>material-icon-theme@{metadata.upstreamVersion}</span>
        </div>
        {SAMPLES.map(({ path, options }) => {
          const icon = getIcon(path, options);
          return (
            <div
              key={path}
              style={{ display: "flex", alignItems: "center", gap: 16 }}
            >
              {/* biome-ignore lint/performance/noImgElement: rendered by Satori, not the browser */}
              <img src={icon?.url} width={34} height={34} alt="" />
              <span style={{ fontSize: 24 }}>{path}</span>
              <span style={{ marginLeft: "auto", fontSize: 20, color: MUTED }}>
                {icon?.name}
              </span>
            </div>
          );
        })}
      </div>
    </div>,
    {
      ...size,
      fonts: [
        { name: "Geist Mono", data: regular, weight: 400, style: "normal" },
        { name: "Geist Mono", data: semibold, weight: 600, style: "normal" },
      ],
    },
  );
}
