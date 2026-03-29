import { Priority, Task } from './task';

export interface TimeSlot {
    taskId: string;
    taskTitle: string;
    start: Date;
    end: Date;
    priority?: Priority;
    completed: boolean;
}

export interface CalendarEvent {
    id: string;
    title: string;
    start: Date;
    end: Date;
    allDay?: boolean;
    resource?: Task;
}
