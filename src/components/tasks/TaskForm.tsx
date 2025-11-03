'use client';

import { useState } from 'react';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';

interface TaskFormProps {
    onAddTask: (title: string) => void;
}

export default function TaskForm({ onAddTask }: TaskFormProps) {
    const [title, setTitle] = useState('');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (title.trim()) {
            onAddTask(title.trim());
            setTitle('');
        }
    };

    return (
        <form onSubmit={handleSubmit} className="flex gap-2">
            <Input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Add a new task..."
                className="flex-1"
            />
            <Button type="submit" disabled={!title.trim()}>
                Add
            </Button>
        </form>
    );
}