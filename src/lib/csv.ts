/*
 * CSV for spreadsheets (Excel, Google Sheets, Numbers): comma-separated, quoted where needed,
 * CRLF line ends, with a byte-order mark so Excel reads the naira sign and accents correctly.
 */

type Cell = string | number | null | undefined;

function quote(cell: Cell): string {
  const text = cell === null || cell === undefined ? "" : String(cell);
  return /[",\r\n]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text;
}

export function toCsv(header: string[], rows: Cell[][]): string {
  return "﻿" + [header, ...rows].map((row) => row.map(quote).join(",")).join("\r\n");
}
