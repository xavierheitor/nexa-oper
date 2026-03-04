import dayjs from 'dayjs';
import type { PaginatedParams, PaginatedResult } from '@/lib/types/common';

const EXPORT_PAGE_SIZE = 200;

function escapeCsvCell(value: unknown): string {
  if (value === null || value === undefined) return '""';
  return `"${String(value).replace(/"/g, '""')}"`;
}

export async function fetchAllPaginatedRows<T>(
  fetchPage: (params?: PaginatedParams) => Promise<PaginatedResult<T>>,
  params: PaginatedParams,
  pageSize = EXPORT_PAGE_SIZE
): Promise<T[]> {
  const baseParams: PaginatedParams = {
    ...params,
    page: 1,
    pageSize,
  };

  const firstPage = await fetchPage(baseParams);
  const rows: T[] = [...firstPage.data];
  const totalPages =
    firstPage.totalPages > 0
      ? firstPage.totalPages
      : Math.ceil(firstPage.total / pageSize);

  for (let page = 2; page <= totalPages; page += 1) {
    const nextPage = await fetchPage({ ...baseParams, page });
    rows.push(...nextPage.data);
  }

  return rows;
}

export function downloadCsvAsExcelFile(
  filePrefix: string,
  headers: string[],
  rows: unknown[][]
): void {
  const csvRows = [headers.map(escapeCsvCell).join(';')];

  rows.forEach((row) => {
    csvRows.push(row.map(escapeCsvCell).join(';'));
  });

  const csvContent = csvRows.join('\n');
  const blob = new Blob([`\uFEFF${csvContent}`], {
    type: 'text/csv;charset=utf-8;',
  });

  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${filePrefix}_${dayjs().format('DD-MM-YYYY_HH-mm')}.csv`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
