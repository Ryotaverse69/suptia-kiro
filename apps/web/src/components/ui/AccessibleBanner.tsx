import React from 'react';

export interface AccessibleBannerProps extends React.HTMLAttributes<HTMLDivElement> {
  status?: 'info' | 'warning' | 'error' | 'success';
  title?: string;
  children?: React.ReactNode;
}

export function AccessibleBanner({ status = 'info', title, children, className = '', ...rest }: AccessibleBannerProps) {
  const styles: Record<string, { wrap: string; title: string; text: string }> = {
    info: { wrap: 'bg-primary-50 border-primary-200', title: 'text-primary-800', text: 'text-primary-700' },
    warning: { wrap: 'bg-yellow-50 border-yellow-200', title: 'text-yellow-800', text: 'text-yellow-700' },
    error: { wrap: 'bg-red-50 border-red-200', title: 'text-red-800', text: 'text-red-700' },
    success: { wrap: 'bg-green-50 border-green-200', title: 'text-green-800', text: 'text-green-700' },
  };
  const s = styles[status] || styles.info;
  return (
    <div role="status" aria-live="polite" className={`border rounded-lg p-4 ${s.wrap} ${className}`} {...rest}>
      {title && <div className={`font-semibold ${s.title} mb-1`}>{title}</div>}
      <div className={`text-sm ${s.text}`}>{children}</div>
    </div>
  );
}

export default AccessibleBanner;
