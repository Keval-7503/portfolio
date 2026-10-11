import type { ReactNode } from "react";

import { safeExternalUrl } from "@/lib/security/urls";

const MAX_MARKDOWN_LENGTH = 100_000;

function inline(text: string): ReactNode[] {
  const nodes: ReactNode[] = [];
  const pattern = /(`[^`\n]+`)|(!?\[([^\]]+)\]\(([^\s)]+)\))/g;
  let cursor = 0;
  let match: RegExpExecArray | null;

  while ((match = pattern.exec(text)) !== null) {
    if (match.index > cursor) nodes.push(text.slice(cursor, match.index));
    if (match[1]) {
      nodes.push(<code key={`${match.index}-code`}>{match[1].slice(1, -1)}</code>);
    } else {
      const label = match[3];
      const target = safeExternalUrl(match[4]);
      const isImage = match[2].startsWith("!");
      nodes.push(
        target && !isImage ? (
          <a href={target} key={`${match.index}-link`} rel="noreferrer" target="_blank">
            {label}
          </a>
        ) : (
          <span key={`${match.index}-text`}>{label}</span>
        ),
      );
    }
    cursor = pattern.lastIndex;
  }

  if (cursor < text.length) nodes.push(text.slice(cursor));
  return nodes;
}

export function SafeMarkdown({ markdown }: { markdown: string }) {
  const source = markdown.slice(0, MAX_MARKDOWN_LENGTH).replaceAll("\0", "");
  const lines = source.split(/\r?\n/);
  const blocks: ReactNode[] = [];
  let index = 0;

  while (index < lines.length) {
    const line = lines[index];
    if (!line.trim()) {
      index += 1;
      continue;
    }

    if (line.startsWith("```")) {
      const language = line
        .slice(3)
        .trim()
        .replace(/[^a-z0-9_+-]/gi, "");
      const code: string[] = [];
      index += 1;
      while (index < lines.length && !lines[index].startsWith("```")) {
        code.push(lines[index]);
        index += 1;
      }
      index += index < lines.length ? 1 : 0;
      blocks.push(
        <pre key={`code-${index}`}>
          <code data-language={language || undefined}>{code.join("\n")}</code>
        </pre>,
      );
      continue;
    }

    const heading = /^(#{1,4})\s+(.+)$/.exec(line);
    if (heading) {
      const content = inline(heading[2]);
      const key = `heading-${index}`;
      blocks.push(
        heading[1].length === 1 ? (
          <h2 key={key}>{content}</h2>
        ) : heading[1].length === 2 ? (
          <h3 key={key}>{content}</h3>
        ) : (
          <h4 key={key}>{content}</h4>
        ),
      );
      index += 1;
      continue;
    }

    if (/^[-*]\s+/.test(line)) {
      const items: string[] = [];
      while (index < lines.length && /^[-*]\s+/.test(lines[index])) {
        items.push(lines[index].replace(/^[-*]\s+/, ""));
        index += 1;
      }
      blocks.push(
        <ul key={`list-${index}`}>
          {items.map((item, itemIndex) => (
            <li key={itemIndex}>{inline(item)}</li>
          ))}
        </ul>,
      );
      continue;
    }

    const paragraph: string[] = [line];
    index += 1;
    while (
      index < lines.length &&
      lines[index].trim() &&
      !/^(#{1,4})\s|^```|^[-*]\s+/.test(lines[index])
    ) {
      paragraph.push(lines[index]);
      index += 1;
    }
    blocks.push(<p key={`paragraph-${index}`}>{inline(paragraph.join(" "))}</p>);
  }

  return <div className="safe-markdown">{blocks}</div>;
}
