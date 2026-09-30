"use client";

import { Fragment, type ReactNode } from "react";
import { cn } from "@/lib/utils";

type Block =
  | { kind: "title"; text: string }
  | { kind: "section"; text: string }
  | { kind: "p"; text: string }
  | { kind: "ul"; items: string[] }
  | { kind: "table"; header: string[]; rows: string[][] };

function stripMdBold(text: string): string {
  return text.replace(/^\*\*(.+)\*\*$/, "$1").trim();
}

function isTableRow(line: string): boolean {
  const t = line.trim();
  return t.startsWith("|") && t.includes("|", 1);
}

function parseTableRow(line: string): string[] {
  const t = line.trim();
  const inner = t.startsWith("|") ? t.slice(1) : t;
  const trimmed = inner.endsWith("|") ? inner.slice(0, -1) : inner;
  return trimmed.split("|").map((c) => c.trim());
}

function isSeparatorRow(cells: string[]): boolean {
  return cells.length > 0 && cells.every((c) => /^:?-{2,}:?$/.test(c));
}

/** Some models wrap wide tables across two pipe-lines per logical row — merge them. */
function mergeSplitTableRows(header: string[], rows: string[][]): string[][] {
  const cols = header.length;
  if (cols < 2) return rows;

  const merged: string[][] = [];
  let i = 0;
  while (i < rows.length) {
    const row = rows[i];
    if (row.length === cols) {
      merged.push(row);
      i += 1;
      continue;
    }
    if (row.length < cols && i + 1 < rows.length) {
      const combined = [...row, ...rows[i + 1]];
      if (combined.length >= cols) {
        merged.push(combined.slice(0, cols));
        i += 2;
        continue;
      }
    }
    merged.push(row);
    i += 1;
  }
  return merged;
}

function parseBlocks(source: string): Block[] {
  const lines = source.split("\n");
  const blocks: Block[] = [];
  let list: string[] = [];

  const flushList = () => {
    if (list.length > 0) {
      blocks.push({ kind: "ul", items: list });
      list = [];
    }
  };

  for (let i = 0; i < lines.length; i++) {
    const raw = lines[i];
    const line = raw.trim();
    if (!line) {
      flushList();
      continue;
    }

    if (isTableRow(line)) {
      flushList();
      const tableLines: string[] = [line];
      while (i + 1 < lines.length && isTableRow(lines[i + 1].trim())) {
        i += 1;
        tableLines.push(lines[i].trim());
      }
      const parsed = tableLines.map(parseTableRow);
      if (parsed.length >= 1) {
        const header = parsed[0];
        let bodyStart = 1;
        if (parsed.length > 1 && isSeparatorRow(parsed[1])) {
          bodyStart = 2;
        }
        const rows = mergeSplitTableRows(header, parsed.slice(bodyStart));
        blocks.push({ kind: "table", header, rows });
      }
      continue;
    }

    const heading = line.match(/^#{1,3}\s+(.+)/);
    if (heading) {
      flushList();
      blocks.push({ kind: "section", text: heading[1] });
      continue;
    }

    const boldLine = line.match(/^\*\*(.+)\*\*$/);
    if (boldLine) {
      flushList();
      const text = boldLine[1];
      const isTitle =
        /executive summary/i.test(text) ||
        (blocks.length === 0 && text.length > 40);
      blocks.push({ kind: isTitle ? "title" : "section", text });
      continue;
    }

    const sectionNum = line.match(/^\*\*(\d+\.\s.+)\*\*$/);
    if (sectionNum) {
      flushList();
      blocks.push({ kind: "section", text: sectionNum[1] });
      continue;
    }

    const bullet = line.match(/^[-*•]\s+(.+)/);
    if (bullet) {
      list.push(bullet[1]);
      continue;
    }

    flushList();
    blocks.push({ kind: "p", text: line });
  }

  flushList();
  return blocks;
}

function cellLooksLikeId(text: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-/i.test(text);
}

function cellLooksLikePath(text: string): boolean {
  const plain = text.replace(/`/g, "");
  return plain.includes("/") || plain.includes("\\");
}

function renderInline(text: string, keyPrefix: string): ReactNode[] {
  const nodes: ReactNode[] = [];
  const re = /(\*\*[^*]+\*\*|`[^`]+`)/g;
  let last = 0;
  let j = 0;
  let match: RegExpExecArray | null;

  while ((match = re.exec(text)) !== null) {
    if (match.index > last) {
      nodes.push(
        <Fragment key={`${keyPrefix}-t-${j++}`}>{text.slice(last, match.index)}</Fragment>
      );
    }
    const token = match[0];
    if (token.startsWith("`")) {
      nodes.push(
        <code
          key={`${keyPrefix}-c-${j++}`}
          className="break-all border border-border bg-surface px-1 py-0.5 font-mono text-[0.85em] text-foreground"
        >
          {token.slice(1, -1)}
        </code>
      );
    } else {
      nodes.push(
        <strong key={`${keyPrefix}-b-${j++}`} className="font-semibold text-foreground">
          {token.slice(2, -2)}
        </strong>
      );
    }
    last = match.index + token.length;
  }

  if (last < text.length) {
    nodes.push(<Fragment key={`${keyPrefix}-t-${j++}`}>{text.slice(last)}</Fragment>);
  }

  return nodes.length > 0 ? nodes : [text];
}

function TableBlock({ header, rows }: { header: string[]; rows: string[][] }) {
  return (
    <div className="narrative-table-wrap -mx-1 overflow-x-auto border border-border bg-background">
      <table className="w-full min-w-[520px] border-collapse text-left text-xs">
        <thead>
          <tr className="border-b border-border bg-surface">
            {header.map((h, i) => (
              <th
                key={i}
                className="whitespace-nowrap px-3 py-2 font-medium text-foreground"
              >
                {renderInline(h, `th-${i}`)}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, ri) => (
            <tr key={ri} className="border-b border-border last:border-0">
              {header.map((_, ci) => {
                const cell = row[ci] ?? "—";
                const mono = cellLooksLikeId(cell) || cellLooksLikePath(cell);
                return (
                  <td
                    key={ci}
                    className={cn(
                      "max-w-[220px] px-3 py-2 align-top text-ink-muted",
                      mono && "font-mono text-[11px] leading-snug break-all"
                    )}
                  >
                    {renderInline(cell, `td-${ri}-${ci}`)}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

type NarrativeMarkdownProps = {
  content: string;
  className?: string;
  compact?: boolean;
};

export default function NarrativeMarkdown({
  content,
  className,
  compact = false,
}: NarrativeMarkdownProps) {
  const blocks = parseBlocks(content);

  return (
    <article
      className={cn(
        "w-full min-w-0 text-sm leading-relaxed text-ink-muted",
        compact ? "max-w-none space-y-3" : "mt-4 max-w-[72ch] space-y-4",
        className
      )}
    >
      {blocks.map((block, idx) => {
        if (block.kind === "title") {
          return (
            <header key={idx} className="border-b border-border pb-3">
              <h4 className="text-base font-semibold text-foreground">
                {renderInline(stripMdBold(block.text), `t-${idx}`)}
              </h4>
            </header>
          );
        }

        if (block.kind === "section") {
          return (
            <h5
              key={idx}
              className={cn(
                "border-b border-border pb-1.5 text-sm font-semibold text-foreground",
                idx > 0 && "pt-1"
              )}
            >
              {renderInline(stripMdBold(block.text), `s-${idx}`)}
            </h5>
          );
        }

        if (block.kind === "table") {
          return <TableBlock key={idx} header={block.header} rows={block.rows} />;
        }

        if (block.kind === "ul") {
          return (
            <ul key={idx} className="ml-0 list-none space-y-2 border-l border-border pl-4">
              {block.items.map((item, j) => (
                <li key={j} className="relative pl-0">
                  <span className="absolute -left-4 top-[0.55em] h-px w-2 bg-border" aria-hidden />
                  {renderInline(item, `li-${idx}-${j}`)}
                </li>
              ))}
            </ul>
          );
        }

        return (
          <p key={idx} className="text-ink-muted">
            {renderInline(block.text, `p-${idx}`)}
          </p>
        );
      })}
    </article>
  );
}
