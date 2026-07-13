/**
 * @fileoverview TasksView component that serves as the main container for task display.
 * Provides view switching between list and board views, sorting options,
 * and handles loading/error states.
 */

"use client";

import { useState, useEffect, useMemo } from "react";
import dynamic from "next/dynamic";
import { Task, Tag, TaskStatus } from "@/types";
import { MyLoader } from "@/components/shared/MyLoader";
import { ListUnorderedIcon, TableIcon } from "@/components/shared/icons";
import Button from "@/components/ui/Button";
import { SearchMagnifyingGlassIcon } from "@/components/shared/icons";

// Lazy load view components as they are heavy and conditional
const TaskList = dynamic(() => import("../board/TaskList"), {
  loading: () => <MyLoader label="Loading list view..." />,
  ssr: false,
});

const TaskBoardView = dynamic(() => import("../board/TaskBoardView"), {
  loading: () => <MyLoader label="Loading board view..." />,
  ssr: false,
});

/** Available sort types for task ordering */
type SortType = "default" | "alphabetical" | "createdAt" | "priority";

/**
 * Props for the TasksView component.
 */
interface TasksViewProps {
  tasks: Task[];
  activeTaskId: string | null;
  tags: Tag[];
  loading?: boolean;
  error?: string | null;
  onToggle: (id: string) => void;
  onDelete: (id: string) => void;
  onSelectTask: (id: string | null) => void;
  onUpdate: (id: string, updates: Partial<Task>) => void;
  onAddSubTask: (taskId: string, title: string) => void;
  onToggleSubTask: (taskId: string, subTaskId: string) => void;
  onDeleteSubTask: (taskId: string, subTaskId: string) => void;
  onReorder: (startIndex: number, endIndex: number) => void;
  onEditTask: (task: Task) => void;
  /** Whether to show sorting options UI */
  showSortOptions?: boolean;
}

/** Available view types for task display */
type ViewType = "list" | "board";

export default function TasksView(props: TasksViewProps) {
  const [view, setView] = useState<ViewType>("list");
  const [sortType, setSortType] = useState<SortType>(() => {
    if (typeof window === "undefined") return "default";
    const savedSort = localStorage.getItem("taskSortType") as SortType;
    return savedSort &&
      ["default", "alphabetical", "createdAt", "priority"].includes(savedSort)
      ? savedSort
      : "default";
  });
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTaskIds, setSelectedTaskIds] = useState<Set<string>>(new Set());
  const showSortOptions = props.showSortOptions ?? true;

   const filteredTasks = useMemo(() => {
     if (!searchQuery.trim()) return props.tasks;
     const query = searchQuery.toLowerCase().trim();
     return props.tasks.filter((task) => {
       const searchableText = [
         task.title,
         task.notes,
         ...(task.tags || []),
         task.priority,
         task.subDomain,
       ]
         .filter(Boolean)
         .join(" ")
         .toLowerCase();
       return searchableText.includes(query);
     });
   }, [props.tasks, searchQuery]);

   // Sorting function
   const sortTasks = (taskList: Task[]): Task[] => {
     return [...taskList].sort((a, b) => {
       switch (sortType) {
         case "alphabetical":
           return a.title.localeCompare(b.title);

         case "createdAt":
           return a.createdAt - b.createdAt;

         case "priority":
           const priorityOrder = { high: 3, medium: 2, low: 1 };
           const aPriority = priorityOrder[a.priority || "low"];
           const bPriority = priorityOrder[b.priority || "low"];
           return bPriority - aPriority; // High priority first

         case "default":
         default:
           // Sort by dueDate first (null dates go to end), then by priority
           const aDate = a.dueDate || Infinity;
           const bDate = b.dueDate || Infinity;

           if (aDate !== bDate) {
             return aDate - bDate;
           }

           // Same date or both null, sort by priority
           const priorityOrderDefault = { high: 3, medium: 2, low: 1 };
           const aPriorityDefault = priorityOrderDefault[a.priority || "low"];
           const bPriorityDefault = priorityOrderDefault[b.priority || "low"];
           return bPriorityDefault - aPriorityDefault; // High priority first
       }
     });
   };

   const sortedAndFilteredTasks = sortTasks(filteredTasks);

  const toggleTaskSelection = (taskId: string) => {
    setSelectedTaskIds((prev) => {
      const next = new Set(prev);
      if (next.has(taskId)) {
        next.delete(taskId);
      } else {
        next.add(taskId);
      }
      return next;
    });
  };

  const selectAllVisible = () => {
    setSelectedTaskIds(new Set(sortedAndFilteredTasks.map((t) => t.id)));
  };

  const clearSelection = () => {
    setSelectedTaskIds(new Set());
  };

  const handleBulkComplete = async () => {
    const selectedArray = Array.from(selectedTaskIds);
    await Promise.all(
      selectedArray.map((id) =>
        props.onUpdate(id, {
          completed: true,
          completedAt: Date.now(),
          status: "done",
        })
      )
    );
    clearSelection();
  };

  const handleBulkDelete = async () => {
    const selectedArray = Array.from(selectedTaskIds);
    await Promise.all(selectedArray.map((id) => props.onDelete(id)));
    clearSelection();
  };

  // Save sort preference to localStorage
  useEffect(() => {
    localStorage.setItem("taskSortType", sortType);
  }, [sortType]);

  const handleStatusChange = (taskId: string, status: TaskStatus) => {
    props.onUpdate(taskId, {
      status,
      completed: status === "done",
      completedAt: status === "done" ? Date.now() : undefined,
    });
  };

  const sortOptions = [
    { value: "default" as SortType, label: "Due Date & Priority", icon: "" },
    { value: "alphabetical" as SortType, label: "Alphabetical", icon: "" },
    { value: "createdAt" as SortType, label: "Date Added", icon: "" },
    { value: "priority" as SortType, label: "Priority", icon: "" },
  ];

  return (
    <div className="space-y-4">
      {/* Sorting Options */}
      {showSortOptions && (
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-muted-foreground">
              Sort by:
            </span>
            <div className="flex gap-1 bg-muted p-1 rounded-xl">
              {sortOptions.map((option) => (
                <button
                  key={option.value}
                  onClick={() => setSortType(option.value)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all cursor-pointer flex items-center gap-1 ${
                    sortType === option.value
                      ? "bg-background text-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <span>{option.icon}</span>
                  <span>{option.label}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="relative">
              <SearchMagnifyingGlassIcon
                size={16}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
              />
              <input
                type="text"
                placeholder="Search tasks..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 pr-4 py-2 text-sm rounded-xl border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary w-64"
              />
            </div>

            {selectedTaskIds.size > 0 && (
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">
                  {selectedTaskIds.size} selected
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleBulkComplete}
                  className="text-xs"
                >
                  Complete
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleBulkDelete}
                  className="text-xs text-error hover:text-error"
                >
                  Delete
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={clearSelection}
                  className="text-xs"
                >
                  Cancel
                </Button>
              </div>
            )}
          </div>

          <div className="text-sm text-muted-foreground">
            {
              props.tasks.filter((t) => !t.completed && t.status !== "done")
                .length
            }{" "}
            active tasks
          </div>
          {/* View Toggle */}
          <div className="flex items-center gap-2 bg-muted p-1 rounded-xl">
            <button
              onClick={() => setView("list")}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-all cursor-pointer ${
                view === "list"
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <div className="flex items-center gap-2">
                <ListUnorderedIcon size={16} />
                <span>List</span>
              </div>
            </button>
            <button
              onClick={() => setView("board")}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-all cursor-pointer ${
                view === "board"
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <div className="flex items-center gap-2">
                <TableIcon size={16} />
                <span>Board</span>
              </div>
            </button>
          </div>
        </div>
      )}

      {/* Loading State */}
      {props.loading && (
        <div className="flex items-center justify-center py-12">
          <MyLoader label="Loading tasks" />
        </div>
      )}

      {/* Error State */}
      {props.error && (
        <div className="bg-error/10 border border-error/20 rounded-lg p-4 text-center">
          <p className="text-error font-medium mb-2">Failed to load tasks</p>
          <p className="text-sm text-muted-foreground">{props.error}</p>
        </div>
      )}

      {/* View Content */}
      {!props.loading && !props.error && (
        <>
          {view === "list" ? (
            <TaskList
              {...props}
              tasks={sortedAndFilteredTasks}
              sortType={sortType}
              sortTasks={sortTasks}
              searchQuery={searchQuery}
              selectedTaskIds={selectedTaskIds}
              onToggleSelection={toggleTaskSelection}
              onSelectAll={selectAllVisible}
              onClearSelection={clearSelection}
              onBulkComplete={handleBulkComplete}
              onBulkDelete={handleBulkDelete}
            />
          ) : (
            <TaskBoardView
              {...props}
              tasks={sortedAndFilteredTasks}
              sortType={sortType}
              sortTasks={sortTasks}
              searchQuery={searchQuery}
              selectedTaskIds={selectedTaskIds}
              onToggleSelection={toggleTaskSelection}
              onSelectAll={selectAllVisible}
              onClearSelection={clearSelection}
              onBulkComplete={handleBulkComplete}
              onBulkDelete={handleBulkDelete}
              onStatusChange={handleStatusChange}
            />
          )}
        </>
      )}
    </div>
  );
}
