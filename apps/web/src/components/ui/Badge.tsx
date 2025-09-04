import React from 'react';
import { cn } from '@/lib/utils';

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
    variant?: 'high' | 'medium' | 'low' | 'danger' | 'success' | 'info';
    size?: 'sm' | 'md' | 'lg';
    children: React.ReactNode;
}

const badgeVariants = {
    high: 'bg-green-100 text-green-800 border-green-200',
    medium: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    low: 'bg-red-100 text-red-800 border-red-200',
    danger: 'bg-red-100 text-red-800 border-red-200',
    success: 'bg-green-100 text-green-800 border-green-200',
    info: 'bg-blue-100 text-blue-800 border-blue-200'
};

const badgeSizes = {
    sm: 'px-2 py-1 text-xs',
    md: 'px-3 py-1 text-sm',
    lg: 'px-4 py-2 text-base'
};

export const Badge: React.FC<BadgeProps> = ({
    variant = 'info',
    size = 'md',
    className,
    children,
    ...props
}) => {
    return (
        <span
            className={cn(
                'inline-flex items-center font-medium rounded-full border',
                badgeVariants[variant],
                badgeSizes[size],
                className
            )}
            {...props}
        >
            {children}
        </span>
    );
};