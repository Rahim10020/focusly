import Button from "@/components/ui/Button";
import { Task } from "@/types";

interface TaskDetailsModalFooterProps {
  task: Task;
  onClose: () => void;
  onSave: () => void;
  onUpdate: (updates: Partial<Task>) => void;
}

export default function TaskDetailsModalFooter({
  task,
  onClose,
  onSave,
  onUpdate,
}: TaskDetailsModalFooterProps) {
  return (
    <div className="sticky bottom-0 bg-card border-t border-border p-6 flex justify-between gap-3">
      <Button
        onClick={() => {
          onUpdate({ completed: !task.completed });
          onClose();
        }}
        variant="secondary"
      >
        {task.completed ? "Mark as Incomplete" : "Mark as Complete"}
      </Button>
      <div className="flex gap-3">
        <Button variant="ghost" onClick={onClose}>
          Cancel
        </Button>
        <Button
          variant="primary"
          onClick={() => {
            onSave();
            onClose();
          }}
        >
          Save Changes
        </Button>
      </div>
    </div>
  );
}
