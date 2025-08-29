'use client';

import React, { useState, useCallback, KeyboardEvent } from 'react';

export interface TableColumn {
  key: string;
  label: string;
  sortable?: boolean;
  scope?: 'col' | 'row';
}

export interface AccessibleTableProps {
  caption: string;
  headers: TableColumn[];
  data: Array<Record<string, any>>;
  onSort?: (key: string, direction: 'asc' | 'desc') => void;
  className?: string;
  'aria-label'?: string;
}

export type SortDirection = 'asc' | 'desc' | 'none';

// Convert internal sort direction to HTML aria-sort values
function getAriaSortValue(direction: SortDirection | undefined): 'ascending' | 'descending' | 'none' | undefined {
  if (!direction) return undefined;
  switch (direction) {
    case 'asc': return 'ascending';
    case 'desc': return 'descending';
    case 'none': return 'none';
    default: return 'none';
  }
}

export function AccessibleTable({
  caption,
  headers,
  data,
  onSort,
  className = '',
  'aria-label': ariaLabel,
}: AccessibleTableProps) {
  const [sortState, setSortState] = useState<Record<string, SortDirection>>({});

  const handleSort = useCallback((key: string) => {
    const currentDirection = sortState[key] || 'none';
    let newDirection: SortDirection;
    
    if (currentDirection === 'none') {
      newDirection = 'asc';
    } else if (currentDirection === 'asc') {
      newDirection = 'desc';
    } else {
      newDirection = 'asc';
    }

    setSortState(prev => ({
      ...prev,
      [key]: newDirection,
    }));

    if (onSort && (newDirection === 'asc' || newDirection === 'desc')) {
      onSort(key, newDirection);
    }
  }, [sortState, onSort]);

  const handleKeyDown = useCallback((event: KeyboardEvent<HTMLButtonElement>, key: string) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      handleSort(key);
    }
  }, [handleSort]);

  return (
    <table 
      className={`w-full border-collapse ${className}`}
      aria-label={ariaLabel}
    >
      <caption className="sr-only">
        {caption}
      </caption>
      <thead>
        <tr>
          {headers.map((header) => (
            <th
              key={header.key}
              scope={header.scope || 'col'}
              className="border border-gray-300 px-4 py-2 bg-gray-50 text-left"
              aria-sort={header.sortable ? getAriaSortValue(sortState[header.key] || 'none') : undefined}
            >
              {header.sortable ? (
                <button
                  type="button"
                  className="flex items-center gap-2 w-full text-left font-medium hover:text-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1"
                  onClick={() => handleSort(header.key)}
                  onKeyDown={(e) => handleKeyDown(e, header.key)}
                  aria-label={`${header.label}でソート。現在の状態: ${
                    sortState[header.key] === 'asc' ? '昇順' :
                    sortState[header.key] === 'desc' ? '降順' : 'ソートなし'
                  }`}
                >
                  <span>{header.label}</span>
                  <span className="text-gray-400" aria-hidden="true">
                    {sortState[header.key] === 'asc' && '↑'}
                    {sortState[header.key] === 'desc' && '↓'}
                    {(!sortState[header.key] || sortState[header.key] === 'none') && '↕'}
                  </span>
                </button>
              ) : (
                <span className="font-medium">{header.label}</span>
              )}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {data.map((row, index) => (
          <tr key={index} className="hover:bg-gray-50">
            {headers.map((header) => (
              <td
                key={header.key}
                className="border border-gray-300 px-4 py-2"
              >
                {row[header.key]}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
}