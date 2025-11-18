'use client';

interface KeyboardShortcutsModalProps {
    onClose: () => void;
}

const shortcuts = [
    {
        category: 'Timer Control',
        items: [
            { keys: ['Space'], description: 'Start/Pause timer' },
            { keys: ['R'], description: 'Reset timer' },
            { keys: ['S'], description: 'Skip current session' },
        ],
    },
    {
        category: 'Navigation',
        items: [
            { keys: ['Ctrl', '0'], description: 'Go to Home' },
            { keys: ['Ctrl', '1'], description: 'Go to Statistics' },
            { keys: ['Ctrl', '2'], description: 'Go to Settings' },
        ],
    },
    {
        category: 'Tasks',
        items: [
            { keys: ['N'], description: 'Focus new task input' },
        ],
    },
    {
        category: 'Appearance',
        items: [
            { keys: ['Ctrl', 'T'], description: 'Toggle dark mode' },
        ],
    },
    {
        category: 'Help',
        items: [
            { keys: ['Shift', '?'], description: 'Show this menu' },
        ],
    },
];

export default function KeyboardShortcutsModal({ onClose }: KeyboardShortcutsModalProps) {
    return (
        <div
            className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
            onClick={onClose}
        >
            <div
                className="bg-card rounded-2xl border border-border max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="sticky top-0 bg-card border-b border-border p-6 flex items-center justify-between">
                    <h2 className="text-2xl font-bold text-foreground">
                        Keyboard Shortcuts
                    </h2>
                    <button
                        onClick={onClose}
                        className="text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                    >
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            width="24"
                            height="24"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                        >
                            <line x1="18" y1="6" x2="6" y2="18"></line>
                            <line x1="6" y1="6" x2="18" y2="18"></line>
                        </svg>
                    </button>
                </div>

                {/* Content */}
                <div className="p-6 space-y-6">
                    {shortcuts.map((section) => (
                        <div key={section.category} className="space-y-3">
                            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                                {section.category}
                            </h3>
                            <div className="space-y-2">
                                {section.items.map((item, index) => (
                                    <div
                                        key={index}
                                        className="flex items-center justify-between p-3 bg-muted rounded-lg"
                                    >
                                        <span className="text-sm text-foreground">
                                            {item.description}
                                        </span>
                                        <div className="flex items-center gap-1">
                                            {item.keys.map((key, keyIndex) => (
                                                <span key={keyIndex} className="flex items-center gap-1">
                                                    <kbd className="px-2 py-1 text-xs font-semibold text-foreground bg-background border border-border rounded">
                                                        {key}
                                                    </kbd>
                                                    {keyIndex < item.keys.length - 1 && (
                                                        <span className="text-muted-foreground text-xs">+</span>
                                                    )}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>

                {/* Footer */}
                <div className="sticky bottom-0 bg-card border-t border-border p-6">
                    <p className="text-sm text-muted-foreground text-center">
                        Press <kbd className="px-2 py-1 text-xs font-semibold text-foreground bg-background border border-border rounded">Shift</kbd>
                        {' + '}
                        <kbd className="px-2 py-1 text-xs font-semibold text-foreground bg-background border border-border rounded">?</kbd>
                        {' '}to show this menu anytime
                    </p>
                </div>
            </div>
        </div>
    );
}