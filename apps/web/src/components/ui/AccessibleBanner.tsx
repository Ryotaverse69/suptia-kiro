'use client';

import React, { useCallback, KeyboardEvent } from 'react';

export interface AccessibleBannerProps {
  type: 'warning' | 'error' | 'info' | 'success';
  message: string;
  dismissible?: boolean;
  onDismiss?: () => void;
  role?: 'alert' | 'status';
  className?: string;
  'aria-live'?: 'polite' | 'assertive';
}

const typeStyles = {
  warning: 'bg-yellow-50 border-yellow-200 text-yellow-800',
  error: 'bg-red-50 border-red-200 text-red-800',
  info: 'bg-blue-50 border-blue-200 text-blue-800',
  success: 'bg-green-50 border-green-200 text-green-800',
};

const typeIcons = {
  warning: '⚠️',
  error: '❌',
  info: 'ℹ️',
  success: '✅',
};

export function AccessibleBanner({
  type,
  message,
  dismissible = false,
  onDismiss,
  role = 'status',
  className = '',
  'aria-live': ariaLive = 'polite',
}: AccessibleBannerProps) {
  const handleDismiss = useCallback(() => {
    if (onDismiss) {
      onDismiss();
    }
  }, [onDismiss]);

  const handleKeyDown = useCallback((event: KeyboardEvent<HTMLButtonElement>) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      handleDismiss();
    }
  }, [handleDismiss]);

  return (
    <div
      role={role}
      aria-live={ariaLive}
      className={`
        border rounded-md p-4 flex items-start gap-3
        ${typeStyles[type]}
        ${className}
      `}
    >
      <span 
        className="flex-shrink-0 text-lg"
        aria-hidden="true"
      >
        {typeIcons[type]}
      </span>
      
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium">
          {message}
        </p>
      </div>

      {dismissible && (
        <button
          type="button"
          className="
            flex-shrink-0 ml-2 p-1 rounded-md
            hover:bg-black hover:bg-opacity-10
            focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-current
            transition-colors duration-200
          "
          onClick={handleDismiss}
          onKeyDown={handleKeyDown}
          aria-label="バナーを閉じる"
        >
          <span className="sr-only">閉じる</span>
          <svg
            className="w-4 h-4"
            fill="currentColor"
            viewBox="0 0 20 20"
            aria-hidden="true"
          >
            <path
              fillRule="evenodd"
              d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
              clipRule="evenodd"
            />
          </svg>
        </button>
      )}
    </div>
  );
}