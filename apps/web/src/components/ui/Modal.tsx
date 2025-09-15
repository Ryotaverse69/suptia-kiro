'use client';

import React, { useEffect, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { cn } from '@/lib/utils';

import { Button } from './Button';

export interface ModalProps {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    children: React.ReactNode;
    size?: 'sm' | 'md' | 'lg' | 'xl';
    closeOnOverlayClick?: boolean;
    closeOnEscape?: boolean;
    showCloseButton?: boolean;
    className?: string;
    overlayClassName?: string;
}

const modalSizes = {
    sm: 'max-w-md',
    md: 'max-w-lg',
    lg: 'max-w-2xl',
    xl: 'max-w-4xl',
};

export const Modal: React.FC<ModalProps> = ({
    isOpen,
    onClose,
    title,
    children,
    size = 'md',
    closeOnOverlayClick = true,
    closeOnEscape = true,
    showCloseButton = true,
    className,
    overlayClassName,
}) => {
    const modalRef = useRef<HTMLDivElement>(null);

    const handleKeyDown = useCallback((event: KeyboardEvent) => {
        if (event.key === 'Escape' && closeOnEscape) {
            onClose();
        }
    }, [closeOnEscape, onClose]);

    useEffect(() => {
        if (!isOpen) return;

        const handleKeyDownEvent = (event: KeyboardEvent) => {
            if (closeOnEscape && event.key === 'Escape') {
                event.preventDefault();
                onClose();
            }
            handleKeyDown(event);
        };

        document.addEventListener('keydown', handleKeyDownEvent);
        return () => document.removeEventListener('keydown', handleKeyDownEvent);
    }, [isOpen, closeOnEscape, onClose, handleKeyDown]);

    if (!isOpen) return null;

    const modalContent = (
        <div
            className={cn(
                'fixed inset-0 z-50 flex items-center justify-center p-4',
                overlayClassName
            )}
            role="dialog"
            aria-modal="true"
            aria-labelledby="modal-title"
        >
            {/* オーバーレイ */}
            <div
                className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
                onClick={closeOnOverlayClick ? onClose : undefined}
                aria-hidden="true"
            />

            {/* モーダルコンテンツ */}
            <div
                ref={modalRef}
                className={cn(
                    'relative bg-white rounded-lg shadow-md transform transition-all w-full',
                    modalSizes[size],
                    className
                )}
                role="document"
            >
                {/* ヘッダー */}
                <div className="flex items-center justify-between p-6 border-b border-gray-200">
                    <h2
                        id="modal-title"
                        className="text-xl font-semibold text-gray-900"
                    >
                        {title}
                    </h2>
                    {showCloseButton && (
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={onClose}
                            aria-label="モーダルを閉じる"
                            className="p-2 hover:bg-gray-100 rounded-full"
                        >
                            <svg
                                className="w-5 h-5"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                                aria-hidden="true"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M6 18L18 6M6 6l12 12"
                                />
                            </svg>
                        </Button>
                    )}
                </div>

                {/* コンテンツ */}
                <div className="p-6">
                    {children}
                </div>
            </div>
        </div>
    );

    // ポータルを使用してbodyに直接レンダリング
    return typeof window !== 'undefined'
        ? createPortal(modalContent, document.body)
        : null;
};

export interface ModalHeaderProps {
    children: React.ReactNode;
    className?: string;
}

export const ModalHeader: React.FC<ModalHeaderProps> = ({
    children,
    className,
}) => (
    <div className={cn('mb-4', className)}>
        {children}
    </div>
);

export interface ModalBodyProps {
    children: React.ReactNode;
    className?: string;
}

export const ModalBody: React.FC<ModalBodyProps> = ({
    children,
    className,
}) => (
    <div className={cn('mb-6', className)}>
        {children}
    </div>
);

export interface ModalFooterProps {
    children: React.ReactNode;
    className?: string;
}

export const ModalFooter: React.FC<ModalFooterProps> = ({
    children,
    className,
}) => (
    <div className={cn('flex justify-end space-x-3 pt-4 border-t border-gray-200', className)}>
        {children}
    </div>
);