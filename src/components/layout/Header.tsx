import ThemeToggle from '../ui/ThemeToggle';

export default function Header() {
    return (
        <header className="w-full border-b border-border bg-background/80 backdrop-blur-sm sticky top-0 z-50">
            <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center">
                        <span className="text-primary-foreground font-bold text-lg">F</span>
                    </div>
                    <h1 className="text-xl font-semibold text-foreground">Focusly</h1>
                </div>

                <nav className="flex items-center gap-4">
                    <ThemeToggle />
                </nav>
            </div>
        </header>
    );
}