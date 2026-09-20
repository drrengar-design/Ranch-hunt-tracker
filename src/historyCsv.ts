export interface HistoryCsvRow {
  blind: string;
  hunter: string;
  inAt: string;
  outAt: string;
  season: string;
}

const HEADER = ['Blind', 'Hunter', 'In', 'Out', 'Season'] as const;

export function escapeCsvField(value: string): string {
  if (/[",\r\n]/.test(value)) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

/** UTF-8 CSV with BOM so Excel / Google Sheets open columns cleanly. */
export function historyRowsToCsv(rows: HistoryCsvRow[]): string {
  const lines = [
    HEADER.join(','),
    ...rows.map((row) =>
      [row.blind, row.hunter, row.inAt, row.outAt, row.season]
        .map(escapeCsvField)
        .join(','),
    ),
  ];
  return `\uFEFF${lines.join('\r\n')}`;
}

export function historyCsvFilename(now = new Date()): string {
  const yyyy = now.getFullYear();
  const mm = String(now.getMonth() + 1).padStart(2, '0');
  const dd = String(now.getDate()).padStart(2, '0');
  return `ranch-hunt-history-${yyyy}-${mm}-${dd}.csv`;
}

export function downloadTextFile(
  filename: string,
  contents: string,
  mime = 'text/csv;charset=utf-8',
): void {
  const blob = new Blob([contents], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
