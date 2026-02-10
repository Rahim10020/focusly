/**
 * @fileoverview SubTaskManager component for managing task subtasks.
 */

import { useState } from 'react';
import Input from '../ui/Input';
import Button from '../ui/Button';

interface SubTask {
    title: string;
    completed: boolean;
}

interface SubTaskManagerProps {
    subTasks: SubTask[];
    onSubTasksChange: (subTasks: SubTask[]) => void;
}

export default function SubTaskManager({
    subTasks,
    onSubTasksChange,
}: SubTaskManagerProps) {
    const [newSubTask, setNewSubTask] = useState('');

    const addSubTask = () => {
        if (newSubTask.trim()) {
            onSubTasksChange([...subTasks, { title: newSubTask.trim(), completed: false }]);
            setNewSubTask('');
        }
    };

    const toggleSubTask = (index: number) => {
        onSubTasksChange(subTasks.map((task, i) =>
            i === index ? { ...task, completed: !task.completed } : task
        ));
    };

    const removeSubTask = (index: number) => {
        onSubTasksChange(subTasks.filter((_, i) => i !== index));
    };

    return (
        <div className="space-y-4">
            <div className="flex items-center gap-2">
                <Input
                    type="text"
                    placeholder="Add a subtask..."
                    value={newSubTask}
                    onChange={(e) => setNewSubTask(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && addSubTask()}
                />
                <Button
                    onClick={addSubTask}
                    disabled={!newSubTask.trim()}
                    size="sm"
                >
                    Add
                </Button>
            </div>

            {subTasks.length > 0 ? (
                <div className="space-y-2">
                    {subTasks.map((subTask, index) => (
                        <div key={index} className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                            <input
                                type="checkbox"
                                checked={subTask.completed}
                                onChange={() => toggleSubTask(index)}
                                className="w-4 h-4 text-primary border-border cursor-pointer rounded focus:ring-primary"
                            />
                            <span className={`flex-1 text-sm ${subTask.completed ? 'line-through text-muted-foreground' : 'text-foreground'}`}>
                                {subTask.title}
                            </span>
                            <button
                                onClick={() => removeSubTask(index)}
                                className="text-muted-foreground hover:text-error transition-colors cursor-pointer"
                            >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="text-center py-8 text-muted-foreground">
                    <svg className="w-12 h-12 mx-auto mb-4 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                    </svg>
                    <p>No subtasks added yet</p>
                    <p className="text-sm">Break down your task into smaller steps</p>
                </div>
            )}
        </div>
    );
}
