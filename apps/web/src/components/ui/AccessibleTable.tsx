import React from 'react';

export interface AccessibleTableProps extends React.TableHTMLAttributes<HTMLTableElement> {
  caption?: string;
  children: React.ReactNode;
}

export function AccessibleTable({ caption, children, ...rest }: AccessibleTableProps) {
  return (
    <table {...rest} role="table">
      {caption && <caption className="sr-only">{caption}</caption>}
      {children}
    </table>
  );
}

export default AccessibleTable;

