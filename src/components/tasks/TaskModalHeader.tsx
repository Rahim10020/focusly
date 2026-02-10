/**
 * @fileoverview TaskModalHeader component for modal header.
 */

interface TaskModalHeaderProps {
    isEditing: boolean;
    isFullScreen: boolean;
    onFullScreenToggle: () => void;
    onClose: () => void;
}

export default function TaskModalHeader({
    isEditing,
    isFullScreen,
    onFullScreenToggle,
    onClose,
}: TaskModalHeaderProps) {
    return (
        <div className="sticky top-0 bg-card border-b border-border p-6 flex items-center justify-between z-10">
            <h2 className="text-xl font-semibold text-foreground">
                {isEditing ? 'Edit Task' : 'Create New Task'}
            </h2>
            <div className="flex items-center gap-3">
                <button
                    onClick={onFullScreenToggle}
                    className="p-2 text-muted-foreground hover:text-foreground hover:bg-accent rounded-lg transition-all cursor-pointer"
                    title={isFullScreen ? 'Switch to compact mode' : 'Switch to full screen mode'}
                >
                    {isFullScreen ? (
                        <svg className="w-5 h-5" data-testid="CollapseIcon" viewBox="0 0 32 32" aria-hidden="true" focusable="false">
                            <path d="M30.706 2.706 21.413 12h7.586a1 1 0 0 1 0 2h-10a1 1 0 0 1-1-1V3a1 1 0 0 1 2 0v7.586l9.293-9.293a.999.999 0 1 1 1.413 1.414Zm-29.414 28a.997.997 0 0 0 1.414 0l9.293-9.293v7.586a1 1 0 0 0 2 0V19a1 1 0 0 0-1-1h-10a1 1 0 0 0 0 2h7.586l-9.293 9.293a.999.999 0 0 0 0 1.414Z"></path>
                        </svg>
                    ) : (
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
                        </svg>
                    )}
                </button>
                <button
                    onClick={onClose}
                    className="p-2 text-muted-foreground hover:text-foreground hover:bg-accent rounded-lg transition-all cursor-pointer"
                    title="Close"
                    aria-label="Close"
                >
                    <svg className="w-5 h-5" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
                        <path
                            fill="currentColor"
                            d="M18.3 5.71a1 1 0 0 0-1.41 0L12 10.59 7.11 5.7a1 1 0 1 0-1.41 1.41L10.59 12l-4.89 4.89a1 1 0 1 0 1.41 1.41L12 13.41l4.89 4.89a1 1 0 0 0 1.41-1.41L13.41 12l4.89-4.89a1 1 0 0 0 0-1.4Z"
                        />
                    </svg>
                </button>
            </div>
        </div>
    );
}
