"use client";

import { Columns3, Rows3, Trash2 } from "lucide-react";
import type { TableContent } from "@/types/blocks";
import { Button } from "@/components/ui/Button";
import type { EditorProps } from "../types";

const cell =
  "w-full min-w-32 rounded-md border border-transparent bg-transparent px-2.5 py-2 text-sm text-ink outline-none transition-colors placeholder:text-muted/70 hover:border-line focus:border-iris focus:bg-surface focus:ring-2 focus:ring-iris/15";

/** Spreadsheet-like grid: any text (commas included) per cell, add/remove rows and columns. */
export function TableEditor({ value, onChange }: EditorProps<TableContent>) {
  const headers = Array.isArray(value.headers) && value.headers.length ? value.headers : [""];
  const cols = headers.length;
  // Normalise rows so every row has exactly `cols` cells.
  const rows = (Array.isArray(value.rows) ? value.rows : []).map((r) => Array.from({ length: cols }, (_, i) => r?.[i] ?? ""));

  const set = (next: { headers?: string[]; rows?: string[][] }) => onChange({ ...value, headers: next.headers ?? headers, rows: next.rows ?? rows });

  const addColumn = () => set({ headers: [...headers, `Sütun ${cols + 1}`], rows: rows.map((r) => [...r, ""]) });
  const removeColumn = (c: number) => set({ headers: headers.filter((_, i) => i !== c), rows: rows.map((r) => r.filter((_, i) => i !== c)) });
  const addRow = () => set({ rows: [...rows, Array.from({ length: cols }, () => "")] });
  const removeRow = (r: number) => set({ rows: rows.filter((_, i) => i !== r) });

  return (
    <div className="space-y-3">
      <div className="overflow-x-auto rounded-lg border border-line">
        <table className="w-full border-collapse text-sm">
          <caption className="sr-only">Cədvəl redaktoru: birinci sətir sütun başlıqlarıdır</caption>
          <thead className="bg-surface-2">
            <tr>
              {headers.map((h, c) => (
                <th key={c} scope="col" className="border-b border-line p-1 align-top font-semibold">
                  <div className="flex items-center gap-1">
                    <input
                      aria-label={`Sütun ${c + 1} başlığı`}
                      value={h}
                      placeholder={`Sütun ${c + 1}`}
                      onChange={(e) => set({ headers: headers.map((x, i) => (i === c ? e.target.value : x)) })}
                      className={`${cell} font-semibold`}
                    />
                    <Button variant="danger-ghost" size="icon-sm" aria-label={`Sütun ${c + 1}-i sil`} disabled={cols <= 1} onClick={() => removeColumn(c)}>
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </th>
              ))}
              <th className="w-10 border-b border-line p-1"><span className="sr-only">Əməliyyatlar</span></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {rows.map((row, r) => (
              <tr key={r}>
                {row.map((v, c) => (
                  <td key={c} className="p-1 align-top">
                    <input
                      aria-label={`Sətir ${r + 1}, ${headers[c] || `sütun ${c + 1}`}`}
                      value={v}
                      onChange={(e) => set({ rows: rows.map((rr, i) => (i === r ? rr.map((x, j) => (j === c ? e.target.value : x)) : rr)) })}
                      className={cell}
                    />
                  </td>
                ))}
                <td className="p-1 align-middle">
                  <Button variant="danger-ghost" size="icon-sm" aria-label={`Sətir ${r + 1}-i sil`} onClick={() => removeRow(r)}>
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr>
                <td colSpan={cols + 1} className="px-3 py-4 text-center text-sm text-muted">Sətir yoxdur</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      <div className="flex flex-wrap gap-2">
        <Button variant="soft" size="sm" onClick={addRow}><Rows3 className="h-4 w-4" aria-hidden /> Sətir əlavə et</Button>
        <Button variant="soft" size="sm" onClick={addColumn}><Columns3 className="h-4 w-4" aria-hidden /> Sütun əlavə et</Button>
      </div>
    </div>
  );
}
