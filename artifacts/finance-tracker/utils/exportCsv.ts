import { Platform } from "react-native";
import { File, Paths } from "expo-file-system";
import * as Sharing from "expo-sharing";

function escapeCell(value: unknown): string {
  if (value === null || value === undefined) return "";
  const s = String(value);
  if (/[",\n\r]/.test(s)) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}

export function buildCsv<T>(
  rows: T[],
  columns: { header: string; get: (row: T) => unknown }[]
): string {
  const head = columns.map((c) => escapeCell(c.header)).join(",");
  const body = rows
    .map((r) => columns.map((c) => escapeCell(c.get(r))).join(","))
    .join("\n");
  return `${head}\n${body}`;
}

function downloadOnWeb(filename: string, csv: string) {
  if (typeof document === "undefined") return;
  const blob = new Blob(["\ufeff" + csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  setTimeout(() => URL.revokeObjectURL(url), 100);
}

export async function exportCsv(filename: string, csv: string): Promise<void> {
  if (Platform.OS === "web") {
    downloadOnWeb(filename, csv);
    return;
  }

  const file = new File(Paths.cache, filename);
  if (file.exists) {
    file.delete();
  }
  file.create();
  file.write(csv);

  const canShare = await Sharing.isAvailableAsync();
  if (canShare) {
    await Sharing.shareAsync(file.uri, {
      mimeType: "text/csv",
      dialogTitle: filename,
      UTI: "public.comma-separated-values-text",
    });
  }
}
