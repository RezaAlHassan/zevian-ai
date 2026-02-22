
import React from 'react';
import { ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';

type SortDirection = 'asc' | 'desc' | null;

interface SortableHeader {
  key: string;
  label: string;
  sortable?: boolean;
}

interface TableProps {
  headers: string[] | SortableHeader[];
  rows: React.ReactNode[][];
  sortable?: boolean;
  sortColumn?: string | null;
  sortDirection?: SortDirection;
  onSort?: (column: string, direction: SortDirection) => void;
  onRowClick?: (rowIndex: number) => void;
}

const Table: React.FC<TableProps> = ({
  headers,
  rows,
  sortable = false,
  sortColumn = null,
  sortDirection = null,
  onSort,
  onRowClick
}) => {
  const handleSort = (columnKey: string, isSortable: boolean) => {
    if (!isSortable || !onSort) return;

    let newDirection: SortDirection = 'asc';
    if (sortColumn === columnKey) {
      if (sortDirection === 'asc') {
        newDirection = 'desc';
      } else if (sortDirection === 'desc') {
        newDirection = null;
      }
    }

    onSort(columnKey, newDirection);
  };

  const getSortIcon = (columnKey: string, isSortable: boolean) => {
    if (!isSortable) return null;

    if (sortColumn === columnKey) {
      if (sortDirection === 'asc') {
        return <ArrowUp size={14} className="ml-1 text-primary drop-shadow-sm transition-transform duration-200" />;
      } else if (sortDirection === 'desc') {
        return <ArrowDown size={14} className="ml-1 text-primary drop-shadow-sm transition-transform duration-200" />;
      }
    }
    return <ArrowUpDown size={14} className="ml-1 text-on-surface-tertiary/50 group-hover:text-primary/70 transition-colors duration-200" />;
  };

  const normalizedHeaders = headers.map((header, index) => {
    if (typeof header === 'string') {
      return { key: `col-${index}`, label: header, sortable: false };
    }
    return header;
  });

  return (
    <div className="rounded-lg border border-border overflow-hidden">
      <table className="w-full text-sm text-left">
        <thead className="bg-surface border-b border-border">
          <tr>
            {normalizedHeaders.map((header, index) => {
              const isSortable = sortable && (header.sortable !== false);
              return (
                <th
                  key={header.key || index}
                  scope="col"
                  className={`
                    px-4 py-3 text-xs font-semibold text-on-surface-tertiary uppercase tracking-wider
                    ${isSortable ? 'cursor-pointer hover:bg-surface-hover select-none group' : ''}
                    transition-colors
                  `}
                  onClick={() => handleSort(header.key, isSortable)}
                >
                  <div className="flex items-center">
                    <span>{header.label}</span>
                    {getSortIcon(header.key, isSortable)}
                  </div>
                </th>
              );
            })}
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {rows.map((row, rowIndex) => (
            <tr
              key={rowIndex}
              onClick={() => onRowClick && onRowClick(rowIndex)}
              className={`
                bg-surface-elevated transition-colors
                ${onRowClick ? 'cursor-pointer hover:bg-surface-hover/80' : 'hover:bg-surface-hover/30'}
              `}
            >
              {row.map((cell, cellIndex) => (
                <td
                  key={cellIndex}
                  className="px-4 py-3.5 align-top text-on-surface-secondary"
                  onClick={(e) => {
                    // Prevent row click if clicking a button, link, or input
                    const target = e.target as HTMLElement;
                    if (target.closest('button') || target.closest('a') || target.closest('input') || target.closest('select')) {
                      e.stopPropagation();
                    }
                  }}
                >
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default Table;
