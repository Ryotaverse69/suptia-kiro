import React from 'react';
import { cn } from '@/lib/utils';

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
    variant?: 'default' | 'elevated' | 'outlined';
    hover?: boolean;
    children: React.ReactNode;
}

const cardVariants = {
    default: 'bg-white shadow-sm border border-gray-100',
    elevated: 'bg-white shadow-lg border border-gray-100',
    outlined: 'bg-white border-2 border-gray-200 shadow-none'
};

export const Card: React.FC<CardProps> = ({
    variant = 'default',
    hover = false,
    className,
    children,
    ...props
}) => {
    return (
        <div
            className={cn(
                'rounded-2xl transition-all duration-300',
                cardVariants[variant],
                hover && 'hover:shadow-lg hover:scale-105 cursor-pointer',
                className
            )}
            {...props}
        >
            {children}
        </div>
    );
};

export interface CardHeaderProps extends React.HTMLAttributes<HTMLDivElement> {
    children: React.ReactNode;
}

export const CardHeader: React.FC<CardHeaderProps> = ({
    className,
    children,
    ...props
}) => {
    return (
        <div
            className={cn('p-6 pb-4', className)}
            {...props}
        >
            {children}
        </div>
    );
};

export interface CardContentProps extends React.HTMLAttributes<HTMLDivElement> {
    children: React.ReactNode;
}

export const CardContent: React.FC<CardContentProps> = ({
    className,
    children,
    ...props
}) => {
    return (
        <div
            className={cn('p-6 pt-0', className)}
            {...props}
        >
            {children}
        </div>
    );
};

export interface CardFooterProps extends React.HTMLAttributes<HTMLDivElement> {
    children: React.ReactNode;
}

export const CardFooter: React.FC<CardFooterProps> = ({
    className,
    children,
    ...props
}) => {
    return (
        <div
            className={cn('p-6 pt-4', className)}
            {...props}
        >
            {children}
        </div>
    );
};