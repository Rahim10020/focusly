/**
 * @fileoverview TaskTitleInput component for entering task title.
 */

interface TaskTitleInputProps {
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
    autoFocus?: boolean;
}

export default function TaskTitleInput({
    value,
    onChange,
    placeholder = "What needs to be done?",
    autoFocus = false,
}: TaskTitleInputProps) {
    return (
        <div className="space-y-2">
            <input
                type="text"
                value={value}
                onChange={(e) => onChange(e.target.value)}
                placeholder={placeholder}
                autoFocus={autoFocus}
                className="w-full text-2xl font-medium bg-transparent text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-0 border-0 p-0"
            />
        </div>
    );
}
