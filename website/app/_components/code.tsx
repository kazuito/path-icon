import { highlight } from "sugar-high";

export function Code({
  code,
  className,
}: {
  code: string;
  className?: string;
}) {
  return (
    <code
      className={className}
      // biome-ignore lint/security/noDangerouslySetInnerHtml: sugar-high returns escaped HTML for static, in-repo snippets
      dangerouslySetInnerHTML={{ __html: highlight(code) }}
    />
  );
}
