/**
 * @fileoverview NotesField component for task notes.
 */

interface NotesFieldProps {
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
    rows?: number;
}

export default function NotesField({
    value,
    onChange,
    placeholder = "Add any additional details...",
    rows = 4,
}: NotesFieldProps) {
    return (
        <div className="space-y-2">
            <label className="block text-sm font-medium text-foreground">Notes</label>
            <textarea
                value={value}
                onChange={(e) => onChange(e.target.value)}
                placeholder={placeholder}
                className="w-full px-4 py-3 bg-muted text-foreground border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent resize-none min-h-[120px] transition-all"
                rows={rows}
            />
        </div>
    );
}
