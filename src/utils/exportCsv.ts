export function exportToCsv(filename: string, rows: object[]) {
  if (!rows || !rows.length) return;
  const separator = ';';
  const keys = Object.keys(rows[0]);
  
  const csvRows = rows.map(row => {
    return keys.map(k => {
      let cell = row[k as keyof typeof row] === null || row[k as keyof typeof row] === undefined ? '' : row[k as keyof typeof row];
      cell = cell instanceof Date
        ? cell.toLocaleString('pt-BR')
        : cell.toString();
      
      // Remove quebras de linha que quebram as linhas da planilha no Excel
      cell = cell.replace(/\r?\n|\r/g, ' ');
      // Escapa aspas duplas
      cell = cell.replace(/"/g, '""');
      
      return `"${cell}"`;
    }).join(separator);
  });

  const headerRow = keys.map(k => `"${k.replace(/"/g, '""')}"`).join(separator);
  
  // "sep=;\n" informa ao Excel para usar ponto e vírgula como separador de colunas automaticamente
  const csvContent = `sep=;\n${headerRow}\n${csvRows.join('\n')}`;

  // Prefix BOM (\ufeff) para Excel reconhecer acentuação em UTF-8 corretamente
  const blob = new Blob(["\ufeff", csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  
  const link = document.createElement("a");
  link.setAttribute("href", url);
  link.setAttribute("download", filename.endsWith('.csv') ? filename : `${filename}.csv`);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
