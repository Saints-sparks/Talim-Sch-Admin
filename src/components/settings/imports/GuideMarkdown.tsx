"use client";

import React, { type ReactNode } from "react";
import { cardFrame, table, tableScroll, td, th, theadRow, tr } from "@/components/tl";

/**
 * A small Markdown reader for the import guide (`docs/history-import-guide.md`),
 * covering what that guide uses: headings, paragraphs, rules, bulleted and
 * numbered lists (nested by indentation), tables, and inline code, bold and
 * italics. It never renders HTML from the text, so nothing in the guide can
 * inject markup.
 */

/** A block of the document. */
export type MdBlock =
  | { kind: "heading"; level: number; text: string }
  | { kind: "rule" }
  | { kind: "paragraph"; text: string }
  | { kind: "list"; ordered: boolean; items: MdBlock[][] }
  | { kind: "table"; head: string[]; rows: string[][] };

const LIST_MARKER = /^(\s*)([-*]|\d+\.)\s+/;
const HEADING = /^(#{1,6})\s+(.*)$/;

/**
 * The cells of one table line.
 *
 * @param line - `| a | b |`.
 * @returns The trimmed cells.
 */
function cells(line: string): string[] {
  return line
    .trim()
    .replace(/^\|/, "")
    .replace(/\|$/, "")
    .split("|")
    .map((cell) => cell.trim());
}

/**
 * Whether a line starts a block other than a paragraph.
 *
 * @param line - The line.
 * @returns True for headings, rules, tables and list items.
 */
function startsBlock(line: string): boolean {
  const t = line.trim();
  return HEADING.test(t) || /^-{3,}$/.test(t) || t.startsWith("|") || LIST_MARKER.test(line);
}

/**
 * Parses Markdown into blocks.
 *
 * @param source - The Markdown.
 * @returns The blocks.
 */
export function parseMarkdown(source: string): MdBlock[] {
  return parseLines(source.replace(/\r\n/g, "\n").split("\n"));
}

/**
 * Parses lines into blocks (recursively for list items).
 *
 * @param lines - The lines.
 * @returns The blocks.
 */
function parseLines(lines: string[]): MdBlock[] {
  const blocks: MdBlock[] = [];
  let i = 0;
  while (i < lines.length) {
    const line = lines[i];
    const trimmed = line.trim();
    if (!trimmed) {
      i += 1;
      continue;
    }
    const heading = HEADING.exec(trimmed);
    if (heading) {
      blocks.push({ kind: "heading", level: heading[1].length, text: heading[2].trim() });
      i += 1;
      continue;
    }
    if (/^-{3,}$/.test(trimmed)) {
      blocks.push({ kind: "rule" });
      i += 1;
      continue;
    }
    if (trimmed.startsWith("|")) {
      const rows: string[][] = [];
      while (i < lines.length && lines[i].trim().startsWith("|")) {
        rows.push(cells(lines[i]));
        i += 1;
      }
      const [head = [], maybeRule, ...rest] = rows;
      const body = maybeRule && maybeRule.every((c) => /^:?-+:?$/.test(c)) ? rest : rows.slice(1);
      blocks.push({ kind: "table", head, rows: body });
      continue;
    }
    const marker = LIST_MARKER.exec(line);
    if (marker) {
      const indent = marker[1].length;
      const ordered = /\d/.test(marker[2]);
      const items: string[][] = [];
      // Where an item's text starts; its continuation lines are cut there.
      let offset = marker[0].length;
      while (i < lines.length) {
        const current = lines[i];
        const m = LIST_MARKER.exec(current);
        if (m && m[1].length === indent) {
          items.push([current.slice(m[0].length)]);
          offset = m[0].length;
          i += 1;
          continue;
        }
        const currentIndent = current.length - current.trimStart().length;
        if (current.trim() && currentIndent > indent && items.length) {
          items[items.length - 1].push(current.slice(Math.min(currentIndent, offset)));
          i += 1;
          continue;
        }
        // A blank line inside a list continues it only when the next line is still part of it.
        if (!current.trim()) {
          const next = lines[i + 1] ?? "";
          const nextMarker = LIST_MARKER.exec(next);
          const nextIndent = next.length - next.trimStart().length;
          if (
            next.trim() &&
            ((nextMarker && nextMarker[1].length === indent) || nextIndent > indent)
          ) {
            i += 1;
            continue;
          }
        }
        break;
      }
      blocks.push({ kind: "list", ordered, items: items.map((item) => parseLines(item)) });
      continue;
    }
    const paragraph: string[] = [trimmed];
    i += 1;
    while (i < lines.length && lines[i].trim() && !startsBlock(lines[i])) {
      paragraph.push(lines[i].trim());
      i += 1;
    }
    blocks.push({ kind: "paragraph", text: paragraph.join(" ") });
  }
  return blocks;
}

const INLINE = /(`[^`]+`)|(\*\*[^*]+\*\*)|(\*[^*\s][^*]*\*)/g;

/**
 * Renders inline code, bold and italics; everything else is plain text.
 *
 * @param text - The text.
 * @returns React nodes.
 */
export function renderInline(text: string): ReactNode[] {
  const out: ReactNode[] = [];
  let last = 0;
  let key = 0;
  for (const match of text.matchAll(INLINE)) {
    const at = match.index ?? 0;
    if (at > last) out.push(text.slice(last, at));
    const token = match[0];
    if (match[1]) {
      out.push(
        <code
          key={key++}
          className="rounded bg-tl-track px-1 py-0.5 font-mono text-[0.9em] text-tl-ink"
        >
          {token.slice(1, -1)}
        </code>
      );
    } else if (match[2]) {
      out.push(
        <strong key={key++} className="font-extrabold text-tl-ink">
          {renderInline(token.slice(2, -2))}
        </strong>
      );
    } else {
      out.push(<em key={key++}>{token.slice(1, -1)}</em>);
    }
    last = at + token.length;
  }
  if (last < text.length) out.push(text.slice(last));
  return out;
}

/**
 * Renders blocks.
 *
 * @param blocks - The blocks.
 * @param tight - Inside a list item: paragraphs without their own spacing.
 * @returns React nodes.
 */
function renderBlocks(blocks: MdBlock[], tight = false): ReactNode[] {
  return blocks.map((block, index) => {
    switch (block.kind) {
      case "heading": {
        const level = Math.min(Math.max(block.level, 2), 4);
        const Tag = `h${level}` as "h2" | "h3" | "h4";
        const size =
          level === 2
            ? "mt-8 text-[21px] font-extrabold tracking-[-0.3px]"
            : level === 3
              ? "mt-6 text-[17px] font-extrabold"
              : "mt-4 text-[15px] font-extrabold";
        return (
          <Tag key={index} className={`${size} text-tl-ink first:mt-0`}>
            {renderInline(block.text)}
          </Tag>
        );
      }
      case "rule":
        return <hr key={index} className="my-6 border-tl-line-soft" />;
      case "paragraph":
        return tight ? (
          <span key={index} className="block">
            {renderInline(block.text)}
          </span>
        ) : (
          <p key={index} className="mt-3 leading-relaxed text-tl-body">
            {renderInline(block.text)}
          </p>
        );
      case "list": {
        const List = block.ordered ? "ol" : "ul";
        return (
          <List
            key={index}
            className={`${tight ? "mt-1.5" : "mt-3"} flex flex-col gap-1.5 pl-6 leading-relaxed text-tl-body ${
              block.ordered ? "list-decimal" : "list-disc"
            }`}
          >
            {block.items.map((item, itemIndex) => (
              <li key={itemIndex}>{renderBlocks(item, true)}</li>
            ))}
          </List>
        );
      }
      case "table":
        return (
          <div key={index} className={`${cardFrame} mt-3`}>
            <div className={tableScroll}>
              <table className={`${table} min-w-[560px]`}>
                <thead>
                  <tr className={theadRow}>
                    {block.head.map((cell, c) => (
                      <th key={c} scope="col" className={`${th} normal-case tracking-normal`}>
                        {renderInline(cell)}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {block.rows.map((row, r) => (
                    <tr key={r} className={tr}>
                      {row.map((cell, c) => (
                        <td key={c} className={`${td} align-top`}>
                          {renderInline(cell)}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        );
      default:
        return null;
    }
  });
}

/**
 * Renders a Markdown document (see the module comment for what it reads).
 *
 * @param props - The blocks.
 * @param props.blocks - Parsed with {@link parseMarkdown}.
 * @returns The article body.
 */
export function GuideMarkdown({ blocks }: { blocks: MdBlock[] }) {
  return <div className="text-[15px]">{renderBlocks(blocks)}</div>;
}

export default GuideMarkdown;
