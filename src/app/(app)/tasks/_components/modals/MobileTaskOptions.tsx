"use client";

import { useId, useState } from "react";
import { CaretDownMdIcon } from "@/components/shared/icons";
import { DOMAINS, getDomainFromSubDomain, SubDomain } from "@/types";
import CategorySelector from "../forms/CategorySelector";
import SubTaskManager from "../items/SubTaskManager";

type EditableSubTask = {
  id?: string;
  title: string;
  completed: boolean;
};

interface MobileTaskOptionsProps {
  selectedSubDomain?: SubDomain;
  onSubDomainChange: (value: SubDomain | undefined) => void;
  subTasks: EditableSubTask[];
  onSubTasksChange: (subTasks: EditableSubTask[]) => void;
}

/** Mobile-only category and subtask controls displayed below a task form. */
export default function MobileTaskOptions({
  selectedSubDomain,
  onSubDomainChange,
  subTasks,
  onSubTasksChange,
}: MobileTaskOptionsProps) {
  const [isCategoriesOpen, setIsCategoriesOpen] = useState(false);
  const [isSubTasksOpen, setIsSubTasksOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const categoriesId = useId();
  const subtasksId = useId();

  const selectedCategoryName = selectedSubDomain
    ? DOMAINS[getDomainFromSubDomain(selectedSubDomain)]?.subDomains[
        selectedSubDomain
      ]?.name
    : undefined;
  const completedSubTasks = subTasks.filter((subTask) => subTask.completed).length;

  return (
    <div className="space-y-4">
      <section className="space-y-4">
        <button
          type="button"
          aria-expanded={isCategoriesOpen}
          aria-controls={categoriesId}
          onClick={() => setIsCategoriesOpen((isOpen) => !isOpen)}
          className="w-full flex items-center gap-3 p-2 text-left"
        >
          <CaretDownMdIcon size={32} className={`text-muted-foreground transition-transform ${isCategoriesOpen ? "rotate-180" : ""}`} />
          <span className="text-lg font-medium">Categories</span>
          {selectedCategoryName && <span className="text-sm text-muted-foreground">{selectedCategoryName}</span>}
        </button>
        {isCategoriesOpen && (
          <div id={categoriesId}>
            <CategorySelector selectedSubDomain={selectedSubDomain} onChange={onSubDomainChange} searchQuery={searchQuery} onSearchChange={setSearchQuery} />
          </div>
        )}
      </section>

      <section className="space-y-4">
        <button
          type="button"
          aria-expanded={isSubTasksOpen}
          aria-controls={subtasksId}
          onClick={() => setIsSubTasksOpen((isOpen) => !isOpen)}
          className="w-full flex items-center gap-3 p-2 text-left"
        >
          <CaretDownMdIcon size={32} className={`text-muted-foreground transition-transform ${isSubTasksOpen ? "rotate-180" : ""}`} />
          <span className="text-lg font-medium">Subtasks</span>
          {subTasks.length > 0 && <span className="text-sm text-muted-foreground">{completedSubTasks}/{subTasks.length}</span>}
        </button>
        {isSubTasksOpen && (
          <div id={subtasksId}>
            <SubTaskManager subTasks={subTasks} onSubTasksChange={onSubTasksChange} />
          </div>
        )}
      </section>
    </div>
  );
}
