/**
 * @fileoverview TaskModalDetails component for compact mode form fields.
 */

import TaskTitleInput from "../forms/TaskTitleInput";
import PrioritySelector from "../forms/PrioritySelector";
import TagsSelector from "../forms/TagsSelector";
import ScheduleDuration from "../forms/ScheduleDuration";
import NotesField from "../forms/NotesField";
import { Tag, Priority } from "@/types";

interface TaskModalDetailsProps {
  title: string;
  priority: Priority | undefined;
  tags: Tag[];
  selectedTags: string[];
  startDate: string;
  dueDate: string;
  startTime: string;
  endTime: string;
  estimatedDuration: string;
  notes: string;
  onTitleChange: (value: string) => void;
  onPriorityChange: (value: Priority | undefined) => void;
  onTagsToggle: (tagId: string) => void;
  onStartDateChange: (value: string) => void;
  onDueDateChange: (value: string) => void;
  onStartTimeChange: (value: string) => void;
  onEndTimeChange: (value: string) => void;
  onDurationChange: (value: string) => void;
  onNotesChange: (value: string) => void;
}

export default function TaskModalDetails({
  title,
  priority,
  tags,
  selectedTags,
  startDate,
  dueDate,
  startTime,
  endTime,
  estimatedDuration,
  notes,
  onTitleChange,
  onPriorityChange,
  onTagsToggle,
  onStartDateChange,
  onDueDateChange,
  onStartTimeChange,
  onEndTimeChange,
  onDurationChange,
  onNotesChange,
}: TaskModalDetailsProps) {
  return (
    <div className="p-6 space-y-8">
      <TaskTitleInput value={title} onChange={onTitleChange} autoFocus />

      <PrioritySelector value={priority} onChange={onPriorityChange} />

      <TagsSelector
        tags={tags}
        selectedTags={selectedTags}
        onToggle={onTagsToggle}
      />

      <ScheduleDuration
        startDate={startDate}
        dueDate={dueDate}
        startTime={startTime}
        endTime={endTime}
        estimatedDuration={estimatedDuration}
        onStartDateChange={onStartDateChange}
        onDueDateChange={onDueDateChange}
        onStartTimeChange={onStartTimeChange}
        onEndTimeChange={onEndTimeChange}
        onDurationChange={onDurationChange}
      />

      <NotesField value={notes} onChange={onNotesChange} />
    </div>
  );
}
