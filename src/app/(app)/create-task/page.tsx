/**
 * @fileoverview Create Task page for the Focusly application.
 * Provides a full-featured task creation modal with support for
 * priorities, scheduling, domains, and subtasks.
 * @module app/create-task/page
 */

"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "@/hooks/useAuth";
import TaskEditModal, {
  TaskFormData,
} from "@/app/(app)/tasks/_components/modals/TaskEditModal";
import { useTasks } from "@/hooks/useTasks";
import { ROUTES } from "@/constants";
import { MyLoader } from "@/components/shared/MyLoader";
import { useIsMobile } from "@/hooks/useIsMobile";
import MobileTaskFormPage from "./_components/MobileTaskFormPage";

export default function CreateTaskPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const { addTask } = useTasks();
  const [isModalOpen] = useState(true);
  const isMobile = useIsMobile();

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
        subTasks: taskData.subTasks,
        scheduling: {
          startDate: taskData.startDate,
          startTime: taskData.startTime,
          endTime: taskData.endTime,
          estimatedDuration: taskData.estimatedDuration,
        },
      });

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
    <div>
      {isMobile ? (
        <MobileTaskFormPage onClose={handleClose} onSave={handleSave} />
      ) : (
        <TaskEditModal
          isOpen={isModalOpen}
          onClose={handleClose}
          onSave={handleSave}
        />
      )}
    </div>
  );
}
