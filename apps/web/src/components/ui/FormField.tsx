'use client';

import React from 'react';
import { cn } from '@/lib/utils';
import { useFormAccessibility } from '@/hooks/useAccessibility';

export interface FormFieldProps {
    id: string;
    label: string;
    children: React.ReactNode;
    error?: string;
    helperText?: string;
    required?: boolean;
    className?: string;
}

export const FormField: React.FC<FormFieldProps> = ({
    id,
    label,
    children,
    error,
    helperText,
    required = false,
    className,
}) => {
    const { getErrorProps } = useFormAccessibility();
    const hasError = Boolean(error);

    return (
        <div className={cn('space-y-2', className)}>
            <label
                htmlFor={id}
                className={cn(
                    'block text-sm font-medium',
                    hasError ? 'text-red-700' : 'text-gray-700'
                )}
            >
                {label}
                {required && (
                    <span className="text-red-500 ml-1" aria-label="必須">
                        *
                    </span>
                )}
            </label>

            {children}

            {helperText && !hasError && (
                <p
                    id={`${id}-help`}
                    className="text-sm text-gray-500"
                >
                    {helperText}
                </p>
            )}

            {hasError && (
                <p
                    {...getErrorProps(id)}
                    className="text-sm text-red-600"
                >
                    {error}
                </p>
            )}
        </div>
    );
};

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
    error?: boolean;
}

export const Input: React.FC<InputProps> = ({
    className,
    error = false,
    ...props
}) => {
    return (
        <input
            className={cn(
                'block w-full px-3 py-2 border rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-offset-2 sm:text-sm transition-colors',
                error
                    ? 'border-red-300 text-red-900 placeholder-red-300 focus:ring-red-500 focus:border-red-500'
                    : 'border-gray-300 focus:ring-primary-500 focus:border-primary-500',
                'disabled:bg-gray-50 disabled:text-gray-500 disabled:cursor-not-allowed',
                className
            )}
            {...props}
        />
    );
};

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
    error?: boolean;
}

export const Textarea: React.FC<TextareaProps> = ({
    className,
    error = false,
    ...props
}) => {
    return (
        <textarea
            className={cn(
                'block w-full px-3 py-2 border rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-offset-2 sm:text-sm transition-colors resize-vertical',
                error
                    ? 'border-red-300 text-red-900 placeholder-red-300 focus:ring-red-500 focus:border-red-500'
                    : 'border-gray-300 focus:ring-primary-500 focus:border-primary-500',
                'disabled:bg-gray-50 disabled:text-gray-500 disabled:cursor-not-allowed',
                className
            )}
            {...props}
        />
    );
};

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
    error?: boolean;
    placeholder?: string;
}

export const Select: React.FC<SelectProps> = ({
    className,
    error = false,
    placeholder,
    children,
    ...props
}) => {
    return (
        <select
            className={cn(
                'block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 sm:text-sm transition-colors bg-white',
                error
                    ? 'border-red-300 text-red-900 focus:ring-red-500 focus:border-red-500'
                    : 'border-gray-300 focus:ring-primary-500 focus:border-primary-500',
                'disabled:bg-gray-50 disabled:text-gray-500 disabled:cursor-not-allowed',
                className
            )}
            {...props}
        >
            {placeholder && (
                <option value="" disabled>
                    {placeholder}
                </option>
            )}
            {children}
        </select>
    );
};

export interface CheckboxProps extends React.InputHTMLAttributes<HTMLInputElement> {
    label: string;
    error?: boolean;
}

export const Checkbox: React.FC<CheckboxProps> = ({
    id,
    label,
    error = false,
    className,
    ...props
}) => {
    return (
        <div className="flex items-center">
            <input
                type="checkbox"
                id={id}
                className={cn(
                    'h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500 focus:ring-offset-2 transition-colors',
                    error && 'border-red-300 text-red-600 focus:ring-red-500',
                    'disabled:opacity-50 disabled:cursor-not-allowed',
                    className
                )}
                {...props}
            />
            <label
                htmlFor={id}
                className={cn(
                    'ml-2 block text-sm',
                    error ? 'text-red-700' : 'text-gray-700',
                    'cursor-pointer'
                )}
            >
                {label}
            </label>
        </div>
    );
};

export interface RadioProps extends React.InputHTMLAttributes<HTMLInputElement> {
    label: string;
    error?: boolean;
}

export const Radio: React.FC<RadioProps> = ({
    id,
    label,
    error = false,
    className,
    ...props
}) => {
    return (
        <div className="flex items-center">
            <input
                type="radio"
                id={id}
                className={cn(
                    'h-4 w-4 border-gray-300 text-primary-600 focus:ring-primary-500 focus:ring-offset-2 transition-colors',
                    error && 'border-red-300 text-red-600 focus:ring-red-500',
                    'disabled:opacity-50 disabled:cursor-not-allowed',
                    className
                )}
                {...props}
            />
            <label
                htmlFor={id}
                className={cn(
                    'ml-2 block text-sm',
                    error ? 'text-red-700' : 'text-gray-700',
                    'cursor-pointer'
                )}
            >
                {label}
            </label>
        </div>
    );
};