/**
 * @fileoverview TaskModalFooter component for modal footer actions.
 */

import Button from '../ui/Button';

interface TaskModalFooterProps {
    isEditing: boolean;
    isValid: boolean;
    onClose: () => void;
    onSubmit: () => void;
}

export default function TaskModalFooter({
    isEditing,
    isValid,
    onClose,
    onSubmit,
}: TaskModalFooterProps) {
    return (
        <div className="sticky bottom-0 bg-card border-t border-border p-6 flex justify-end gap-3">
            <Button variant="ghost" onClick={onClose}>
                Cancel
            </Button>
            <Button
                variant="primary"
                onClick={onSubmit}
                disabled={!isValid}
            >
                {isEditing ? 'Save Changes' : 'Create Task'}
            </Button>
        </div>
    );
}
