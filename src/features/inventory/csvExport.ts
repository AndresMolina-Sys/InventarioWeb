function csvCell(value: string): string {
  const formulaLike = /^[\u0000-\u0020\uFEFF]*[=+\-@＝＋－＠]/u.test(value);
  const safeValue = formulaLike ? `\t${value}` : value;
  return `"${safeValue.replaceAll('"', '""')}"`;
}

export function serializeCsvRows(rows: readonly (readonly string[])[]): string {
  return rows.map((row) => row.map(csvCell).join(",")).join("\r\n");
}
