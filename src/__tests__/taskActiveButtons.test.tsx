import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import TaskItem from "@/app/(app)/tasks/_components/items/TaskItem";
import { TaskBoardCard } from "@/app/(app)/tasks/_components/board/TaskBoardCard";
import type { Task } from "@/types";

vi.mock("@/hooks/useSound", () => ({
  useSound: () => ({ playWorkComplete: vi.fn() }),
}));

function makeTask(overrides: Partial<Task> = {}): Task {
  return {
    id: "task-1",
    title: "Test task",
    completed: false,
    status: "todo",
    createdAt: Date.now(),
    pomodoroCount: 0,
    ...overrides,
  };
}

const itemBaseProps = {
  tags: [],
  onToggle: vi.fn(),
  onDelete: vi.fn(),
  onSelect: vi.fn(),
  onUpdate: vi.fn(),
  onAddSubTask: vi.fn(),
  onToggleSubTask: vi.fn(),
  onDeleteSubTask: vi.fn(),
};

describe("completed tasks never show Set Active / Unset / badge", () => {
  it("TaskItem: completed + active hides both buttons and badge", () => {
    render(
      <TaskItem
        {...itemBaseProps}
        task={makeTask({ completed: true })}
        isActive
      />,
    );
    expect(screen.queryByText("Set Active")).toBeNull();
    expect(screen.queryByText("Unset")).toBeNull();
    expect(screen.queryByText("Active")).toBeNull();
  });

  it("TaskItem: active + not completed still shows Unset", () => {
    render(
      <TaskItem
        {...itemBaseProps}
        task={makeTask({ completed: false })}
        isActive
      />,
    );
    expect(screen.getByText("Unset")).toBeInTheDocument();
    expect(screen.queryByText("Set Active")).toBeNull();
  });

  it("TaskItem: completed + not active shows neither button", () => {
    render(
      <TaskItem
        {...itemBaseProps}
        task={makeTask({ completed: true })}
        isActive={false}
      />,
    );
    expect(screen.queryByText("Set Active")).toBeNull();
    expect(screen.queryByText("Unset")).toBeNull();
  });

  it("TaskBoardCard: completed + active hides both buttons and badge", () => {
    render(
      <TaskBoardCard
        task={makeTask({ completed: true, status: "done" })}
        taskTags={[]}
        isActive
        onDragStart={vi.fn()}
        onStatusChange={vi.fn()}
        onEdit={vi.fn()}
        onSelect={vi.fn()}
        onUnselect={vi.fn()}
        onDelete={vi.fn()}
      />,
    );
    expect(screen.queryByText("Set Active")).toBeNull();
    expect(screen.queryByText("Unset")).toBeNull();
    expect(screen.queryByText("Active")).toBeNull();
  });

  it("TaskBoardCard: status done alone (completed=false) still allows Set Active", () => {
    render(
      <TaskBoardCard
        task={makeTask({ completed: false, status: "done" })}
        taskTags={[]}
        isActive={false}
        onDragStart={vi.fn()}
        onStatusChange={vi.fn()}
        onEdit={vi.fn()}
        onSelect={vi.fn()}
        onUnselect={vi.fn()}
        onDelete={vi.fn()}
      />,
    );
    expect(screen.getByText("Set Active")).toBeInTheDocument();
  });
});

describe("TaskItem responsive layout (mobile < lg, desktop lg+)", () => {
  it("renders the title twice: mobile row + desktop content row", () => {
    render(
      <TaskItem
        {...itemBaseProps}
        task={makeTask({ title: "Responsive title" })}
        isActive={false}
      />,
    );
    expect(screen.getAllByText("Responsive title")).toHaveLength(2);
  });

  it("mobile rows are lg:hidden and desktop title row is hidden below lg", () => {
    const { container } = render(
      <TaskItem
        {...itemBaseProps}
        onToggleSelection={vi.fn()}
        task={makeTask({ title: "Breakpoints" })}
        isActive={false}
      />,
    );
    // Mobile top row: drag left + selection right
    const topRow = container.querySelector(
      ".flex.w-full.items-center.justify-between.lg\\:hidden",
    );
    expect(topRow).not.toBeNull();
    // Mobile title row: checkbox + title with wide gap
    const titleRow = container.querySelector(
      ".flex.w-full.items-center.gap-4.lg\\:hidden",
    );
    expect(titleRow).not.toBeNull();
    // Desktop title row hidden on mobile, flex on lg+
    const desktopTitle = container.querySelector(
      ".hidden.items-center.gap-2.lg\\:flex",
    );
    expect(desktopTitle).not.toBeNull();
  });

  it("mobile top row shows drag alone when no selection handler", () => {
    const { container } = render(
      <TaskItem
        {...itemBaseProps}
        task={makeTask({ title: "Drag only" })}
        isActive={false}
      />,
    );
    const topRow = container.querySelector(
      ".flex.w-full.items-center.justify-between.lg\\:hidden",
    );
    expect(topRow).not.toBeNull();
    expect(topRow?.querySelector("button")).toBeNull();
  });
});
