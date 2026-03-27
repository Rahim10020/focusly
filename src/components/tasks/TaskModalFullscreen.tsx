/**
 * @fileoverview TaskModalFullscreen component for fullscreen mode content.
 */

import TaskTitleInput from "./TaskTitleInput";
import PrioritySelector from "./PrioritySelector";
import TagsSelector from "./TagsSelector";
import ScheduleDuration from "./ScheduleDuration";
import NotesField from "./NotesField";
import CategorySelector from "./CategorySelector";
import SubTaskManager from "./SubTaskManager";
import { Tag, SubDomain, Priority, DOMAINS, Domain } from "@/types";
import { CaretDownMdIcon, ExpandIcon } from "../shared/icons";

interface TaskModalFullscreenProps {
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
  selectedSubDomain: SubDomain | undefined;
  subTasks: { title: string; completed: boolean }[];
  searchQuery: string;
  isCategoriesOpen: boolean;
  isSubTasksOpen: boolean;
  onTitleChange: (value: string) => void;
  onPriorityChange: (value: Priority | undefined) => void;
  onTagsToggle: (tagId: string) => void;
  onStartDateChange: (value: string) => void;
  onDueDateChange: (value: string) => void;
  onStartTimeChange: (value: string) => void;
  onEndTimeChange: (value: string) => void;
  onDurationChange: (value: string) => void;
  onNotesChange: (value: string) => void;
  onSubDomainChange: (value: SubDomain | undefined) => void;
  onSubTasksChange: (subTasks: { title: string; completed: boolean }[]) => void;
  onSearchChange: (value: string) => void;
  onCategoriesToggle: () => void;
  onSubTasksToggle: () => void;
}

export default function TaskModalFullscreen({
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
  selectedSubDomain,
  subTasks,
  searchQuery,
  isCategoriesOpen,
  isSubTasksOpen,
  onTitleChange,
  onPriorityChange,
  onTagsToggle,
  onStartDateChange,
  onDueDateChange,
  onStartTimeChange,
  onEndTimeChange,
  onDurationChange,
  onNotesChange,
  onSubDomainChange,
  onSubTasksChange,
  onSearchChange,
  onCategoriesToggle,
  onSubTasksToggle,
}: TaskModalFullscreenProps) {
  return (
    <>
      {/* Main Content */}
      <div className="space-y-8">
        <TaskTitleInput value={title} onChange={onTitleChange} autoFocus />

        <PrioritySelector value={priority} onChange={onPriorityChange} />

        <TagsSelector
          tags={tags}
          selectedTags={selectedTags}
          onToggle={onTagsToggle}
        />

        <div className="border-t border-border" />

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

        <div className="border-t border-border" />

        <NotesField value={notes} onChange={onNotesChange} />
      </div>

      {/* Right Sidebar - Categories & Subtasks */}
      <div className="space-y-6 border-l border-border pl-8">
        {/* Categories Accordion */}
        <div className="space-y-4">
          <button
            onClick={onCategoriesToggle}
            className="w-full flex items-center justify-between p-2 cursor-pointer"
          >
            <div className="flex items-center gap-3">
              {/* A changer apres quand j'aurai une meilleure icone */}
              <CaretDownMdIcon
                size={20}
                className={`text-muted-foreground transition-transform ${isCategoriesOpen ? "rotate-180" : ""}`}
              />
              <span className="text-lg font-medium text-foreground">
                Categories
              </span>
              {selectedSubDomain && (
                <span className="text-sm text-muted-foreground">
                  {
                    DOMAINS[
                      Object.keys(DOMAINS).find(
                        (domain) =>
                          DOMAINS[domain as Domain].subDomains[
                            selectedSubDomain
                          ],
                      ) as Domain
                    ]?.subDomains[selectedSubDomain]
                  }
                </span>
              )}
            </div>
          </button>

          {isCategoriesOpen && (
            <div className="space-y-4 animate-slide-down">
              <CategorySelector
                selectedSubDomain={selectedSubDomain}
                onChange={onSubDomainChange}
                searchQuery={searchQuery}
                onSearchChange={onSearchChange}
              />
            </div>
          )}
        </div>

        {/* Subtasks Accordion */}
        <div className="space-y-4">
          <button
            onClick={onSubTasksToggle}
            className="w-full flex items-center justify-between p-2 cursor-pointer"
          >
            <div className="flex items-center gap-3">
              <CaretDownMdIcon
                size={20}
                className={`text-muted-foreground transition-transform ${isSubTasksOpen ? "rotate-180" : ""}`}
              />
              <span className="text-lg font-medium text-foreground">
                Subtasks
              </span>
              {subTasks.length > 0 && (
                <span className="text-sm text-muted-foreground">
                  {subTasks.filter((t) => t.completed).length}/{subTasks.length}
                </span>
              )}
            </div>
          </button>

          {isSubTasksOpen && (
            <div className="space-y-4 animate-slide-down">
              <SubTaskManager
                subTasks={subTasks}
                onSubTasksChange={onSubTasksChange}
              />
            </div>
          )}
        </div>
      </div>
    </>
  );
}
