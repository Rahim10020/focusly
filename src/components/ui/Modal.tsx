/**
 * @fileoverview Modal dialog component with overlay and keyboard support.
 */

'use client';

import { useEffect, ReactNode } from 'react';
import Button from './Button';

/**
 * Props for the Modal component.
 * @interface ModalProps
 */
interface ModalProps {
    /** Whether the modal is visible */
    isOpen: boolean;
    /** Callback function when modal should close */
    onClose: () => void;
    /** Modal title displayed in the header */
    title?: string;
    /** Description text displayed below the title */
    description?: string;
    /** Main content of the modal */
    children: ReactNode;
    /** Size variant of the modal */
    size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
    /** Content to render in the modal footer */
    footer?: ReactNode;
    /** Whether clicking the overlay closes the modal */
    closeOnOverlayClick?: boolean;
}

/**
 * A modal dialog component with overlay, header, body, and footer sections.
 * Supports keyboard navigation (Escape to close) and body scroll locking.
 *
 * @param {ModalProps} props - The component props
 * @param {boolean} props.isOpen - Controls modal visibility
 * @param {Function} props.onClose - Called when modal should close
 * @param {string} [props.title] - Modal title
 * @param {string} [props.description] - Description text
 * @param {React.ReactNode} props.children - Modal body content
 * @param {('sm'|'md'|'lg'|'xl'|'full')} [props.size='md'] - Modal width
 * @param {React.ReactNode} [props.footer] - Footer content
 * @param {boolean} [props.closeOnOverlayClick=true] - Close on overlay click
 * @returns {JSX.Element|null} The rendered modal or null when closed
 *
 * @example
 * // Basic modal
 * <Modal
 *   isOpen={isOpen}
 *   onClose={() => setIsOpen(false)}
 *   title="Confirm Action"
 * >
 *   <p>Are you sure you want to proceed?</p>
 * </Modal>
 *
 * @example
 * // Modal with footer
 * <Modal
 *   isOpen={isOpen}
 *   onClose={handleClose}
 *   title="Edit Task"
 *   footer={<Button onClick={handleSave}>Save</Button>}
 * >
 *   <Input label="Task name" />
 * </Modal>
 */
export default function Modal({
    isOpen,
    onClose,
    title,
    description,
    children,
    size = 'md',
    footer,
    closeOnOverlayClick = true,
}: ModalProps) {
    // Fermer avec Escape
    useEffect(() => {
        const handleEscape = (e: KeyboardEvent) => {
            if (e.key === 'Escape' && isOpen) {
                onClose();
            }
        };

        if (isOpen) {
            document.addEventListener('keydown', handleEscape);
            // Bloquer le scroll du body
            document.body.style.overflow = 'hidden';
        }

        return () => {
            document.removeEventListener('keydown', handleEscape);
            document.body.style.overflow = 'unset';
        };
    }, [isOpen, onClose]);

    if (!isOpen) return null;

    const sizes = {
        sm: 'max-w-md',
        md: 'max-w-2xl',
        lg: 'max-w-4xl',
        xl: 'max-w-6xl',
        full: 'max-w-full mx-4',
    };

    return (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 animate-fade-in">
            {/* Overlay */}
            <div
                className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                onClick={closeOnOverlayClick ? onClose : undefined}
            />

            {/* Modal Content */}
            <div
                className={`relative bg-card rounded-2xl shadow-2xl border border-border ${sizes[size]} w-full max-h-[90vh] flex flex-col animate-scale-in`}
            >
                {/* Header */}
                {(title || description) && (
                    <div className="px-6 py-5 border-b border-border">
                        <div className="flex items-start justify-between gap-4">
                            <div className="flex-1">
                                {title && (
                                    <h2 className="text-2xl font-bold text-foreground">
                                        {title}
                                    </h2>
                                )}
                                {description && (
                                    <p className="text-sm text-muted-foreground mt-1">
                                        {description}
                                    </p>
                                )}
                            </div>
                            <button
                                onClick={onClose}
                                className="flex-shrink-0 w-8 h-8 flex items-center justify-center rounded-lg hover:bg-accent transition-all focus-ring cursor-pointer"
                                aria-label="Close modal"
                            >
                                <svg
                                    className="w-5 h-5"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M6 18L18 6M6 6l12 12"
                                    />
                                </svg>
                            </button>
                        </div>
                    </div>
                )}

                {/* Body */}
                <div className="flex-1 overflow-y-auto px-6 py-5">
                    {children}
                </div>

                {/* Footer */}
                {footer && (
                    <div className="px-6 py-4 border-t border-border bg-muted/30">
                        {footer}
                    </div>
                )}
            </div>
        </div>
    );
}
