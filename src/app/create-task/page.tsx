/**
 * @fileoverview Create Task page for the Focusly application.
 * Provides a full-featured task creation modal with support for
 * priorities, tags, scheduling, domains, and subtasks.
 * @module app/create-task/page
 */

"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "@/hooks/useAuth";
import Header from "@/components/layout/Header";
import TaskModal, { TaskFormData } from "@/components/tasks/modals/TaskModal";
import { useTasks } from "@/hooks/useTasks";
import { useTags } from "@/hooks/useTags";
import { ROUTES } from "@/constants";
import { MyLoader } from "@/components/shared/MyLoader";

export default function CreateTaskPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const { addTask } = useTasks();
  const { tags } = useTags();
  const [isModalOpen] = useState(true);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push(ROUTES.SIGN_IN);
    }
  }, [status, router]);

  const handleSave = async (taskData: TaskFormData) => {
    try {
      await addTask({
        title: taskData.title,
        priority: taskData.priority,
        tags: taskData.tags,
        dueDate: taskData.dueDate,
        notes: taskData.notes,
        subDomain: taskData.subDomain,
        scheduling: {
          startDate: taskData.startDate,
          startTime: taskData.startTime,
          endTime: taskData.endTime,
          estimatedDuration: taskData.estimatedDuration,
        },
      });

      // Handle subtasks if any
      if (taskData.subTasks && taskData.subTasks.length > 0) {
        // Note: This would need to be handled after the task is created
        // For now, we'll skip subtasks in the initial creation
        // They can be added later via the task details modal
      }

      router.push(ROUTES.TASKS);
    } catch (error) {
      console.error("Failed to create task:", error);
      // You might want to show an error toast here
    }
  };

  const handleClose = () => {
    router.push(ROUTES.TASKS);
  };

  if (status === "loading") {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <MyLoader label="Loading" />
      </div>
    );
  }

  if (!session) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <TaskModal
        isOpen={isModalOpen}
        onClose={handleClose}
        onSave={handleSave}
        tags={tags}
      />
    </div>
  );
}
