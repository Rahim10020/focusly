/**
 * @fileoverview TaskModalHeader component for modal header.
 */

import { useState } from "react";
import { SubDomain, DOMAINS, getDomainFromSubDomain } from "@/types";
import Popover from "@/components/ui/Popover";
import CategorySelector from "../forms/CategorySelector";
import SubTaskManager from "../items/SubTaskManager";
import { CloseLgIcon, ExpandIcon, ShrinkIcon, CaretDownMdIcon, CaretUpMdIcon } from "@/components/shared/icons";

interface TaskModalHeaderProps {
  isEditing: boolean;
  isFullScreen: boolean;
  onFullScreenToggle: () => void;
  onClose: () => void;
  selectedSubDomain?: SubDomain;
  onSubDomainChange?: (value: SubDomain | undefined) => void;
  subTasks?: { title: string; completed: boolean }[];
  onSubTasksChange?: (tasks: { title: string; completed: boolean }[]) => void;
}

export default function TaskModalHeader({
  isEditing,
  isFullScreen,
  onFullScreenToggle,
  onClose,
  selectedSubDomain,
  onSubDomainChange,
  subTasks,
  onSubTasksChange,
}: TaskModalHeaderProps) {
  const [isCategoriesOpen, setIsCategoriesOpen] = useState(false);
  const [isSubTasksOpen, setIsSubTasksOpen] = useState(false);

  const selectedCategoryName = selectedSubDomain
    ? DOMAINS[getDomainFromSubDomain(selectedSubDomain)]?.subDomains[selectedSubDomain]?.name
    : null;

  const completedSubTasks = (subTasks || []).filter((t) => t.completed).length;

  return (
    <div className="sticky top-0 bg-card border-b border-border px-6 py-4 flex items-center justify-between z-10">
      <h2 className="text-2xl font-semibold text-foreground">
        {isEditing ? "Edit Task" : "Create New Task"}
      </h2>
      <div className="flex items-center gap-2 flex-wrap justify-end">
        {onSubDomainChange && (
          <Popover
            open={isCategoriesOpen}
            onOpenChange={setIsCategoriesOpen}
            trigger={
              <button
                type="button"
                className="flex items-center gap-1.5 px-3 py-2 text-sm rounded-lg border border-border hover:bg-accent transition-all cursor-pointer"
              >
                <span className={selectedCategoryName ? "text-foreground" : "text-muted-foreground"}>
                  {selectedCategoryName || "Categories"}
                </span>
                {isCategoriesOpen ? (
                  <CaretUpMdIcon size={16} className="text-muted-foreground" />
                ) : (
                  <CaretDownMdIcon size={16} className="text-muted-foreground" />
                )}
              </button>
            }
            content={
              <CategorySelector
                selectedSubDomain={selectedSubDomain}
                onChange={onSubDomainChange}
                searchQuery=""
                onSearchChange={() => {}}
                compact
              />
            }
          />
        )}

        {onSubTasksChange && (
          <Popover
            open={isSubTasksOpen}
            onOpenChange={setIsSubTasksOpen}
            trigger={
              <button
                type="button"
                className="flex items-center gap-1.5 px-3 py-2 text-sm rounded-lg border border-border hover:bg-accent transition-all cursor-pointer"
              >
                <span className="text-foreground">
                  Subtasks
                </span>
                {(subTasks || []).length > 0 && (
                  <span className="px-1.5 py-0.5 text-xs bg-primary text-white rounded-full">
                    {completedSubTasks}/{(subTasks || []).length}
                  </span>
                )}
                {isSubTasksOpen ? (
                  <CaretUpMdIcon size={16} className="text-muted-foreground" />
                ) : (
                  <CaretDownMdIcon size={16} className="text-muted-foreground" />
                )}
              </button>
            }
            content={
              <SubTaskManager
                subTasks={subTasks || []}
                onSubTasksChange={onSubTasksChange}
                compact
              />
            }
          />
        )}

        <button
          onClick={onFullScreenToggle}
          className="p-2 text-muted-foreground hover:text-foreground hover:bg-accent rounded-lg transition-all cursor-pointer"
          title={
            isFullScreen
              ? "Switch to compact mode"
              : "Switch to full screen mode"
          }
        >
          {isFullScreen ? <ShrinkIcon size={24} /> : <ExpandIcon size={24} />}
        </button>
        <button
          onClick={onClose}
          className="p-2 text-muted-foreground hover:text-foreground hover:bg-accent rounded-lg transition-all cursor-pointer"
          title="Close"
          aria-label="Close"
        >
          <CloseLgIcon size={20} />
        </button>
      </div>
    </div>
  );
}
