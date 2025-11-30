'use client';

import { useState } from 'react';
import { Task } from '@/types';

interface FailTaskModalProps {
    task: Task;
    isOpen: boolean;
    onClose: () => void;
    onConfirm: (updates: Partial<Task>) => void;
}

type Action = 'fail' | 'postpone' | 'cancel';

export function FailTaskModal({ task, isOpen, onClose, onConfirm }: FailTaskModalProps) {
    const [action, setAction] = useState<Action>('fail');
    const [reason, setReason] = useState('');
    const [newDate, setNewDate] = useState('');

    if (!isOpen) return null;

    const handleConfirm = () => {
        let updates: Partial<Task> = {};

        switch (action) {
            case 'fail':
                updates = {
                    failedAt: Date.now(),
                    notes: reason || task.notes
                };
                break;

            case 'postpone':
                if (!newDate) {
                    alert('Veuillez sélectionner une nouvelle date');
                    return;
                }
                updates = {
                    dueDate: new Date(newDate).getTime(),
                };
                break;

            case 'cancel':
                updates = {
                    completed: true,
                    completedAt: Date.now(),
                    notes: (task.notes || '') + '\n[Cancelled]'
                };
                break;
        }

        onConfirm(updates);
        onClose();
        setReason('');
        setNewDate('');
        setAction('fail');
    };

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full mx-4">
                <h2 className="text-xl font-semibold mb-2">Que voulez-vous faire avec cette tâche ?</h2>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">{task.title}</p>

                <div className="space-y-4">
                    <div className="space-y-2">
                        <label className="flex items-center gap-2 cursor-pointer">
                            <input
                                type="radio"
                                value="fail"
                                checked={action === 'fail'}
                                onChange={(e) => setAction(e.target.value as Action)}
                                className="w-4 h-4"
                            />
                            <span>Marquer comme échouée</span>
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer">
                            <input
                                type="radio"
                                value="postpone"
                                checked={action === 'postpone'}
                                onChange={(e) => setAction(e.target.value as Action)}
                                className="w-4 h-4"
                            />
                            <span>Reporter à une autre date</span>
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer">
                            <input
                                type="radio"
                                value="cancel"
                                checked={action === 'cancel'}
                                onChange={(e) => setAction(e.target.value as Action)}
                                className="w-4 h-4"
                            />
                            <span>Annuler définitivement</span>
                        </label>
                    </div>

                    {action === 'fail' && (
                        <div>
                            <label htmlFor="reason" className="block text-sm font-medium mb-2">
                                Raison de l&apos;échec (optionnel)
                            </label>
                            <textarea
                                id="reason"
                                value={reason}
                                onChange={(e) => setReason(e.target.value)}
                                placeholder="Ex: Manque de temps, priorités changées..."
                                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700"
                                rows={3}
                            />
                        </div>
                    )}

                    {action === 'postpone' && (
                        <div>
                            <label htmlFor="newDate" className="block text-sm font-medium mb-2">
                                Nouvelle date limite
                            </label>
                            <input
                                id="newDate"
                                type="date"
                                value={newDate}
                                onChange={(e) => setNewDate(e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700"
                            />
                        </div>
                    )}

                    <div className="flex justify-end gap-2 mt-6">
                        <button
                            onClick={onClose}
                            className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700"
                        >
                            Annuler
                        </button>
                        <button
                            onClick={handleConfirm}
                            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                        >
                            Confirmer
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
