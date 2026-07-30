/**
 * @fileoverview User profile page for the Focusly application.
 * Displays user information, avatar, stats, activity overview,
 * and domain distribution with profile editing capabilities.
 */

"use client";

import { useState } from "react";
import { useSession } from "@/hooks/useAuth";
import { redirect } from "next/navigation";
import { ProfileHeader } from "@/app/(app)/profile/_components/ProfileHeader";
import { ProfileStatsGrid } from "@/app/(app)/profile/_components/ProfileStatsGrid";
import { ActivityOverview } from "@/app/(app)/profile/_components/ActivityOverview";
import { DomainDistribution } from "@/app/(app)/profile/_components/DomainDistribution";
import { getSupabaseClientOrNull } from "@/lib/supabase/client";
import { useTasks } from "@/hooks/useTasks";
import { useStats } from "@/hooks/useStats";
import {
  getDomainDistribution,
  getFocusHours,
  getTaskCompletionStats,
} from "@/lib/domain/services/StatsCalculationService";
import {
  compressImage,
  isValidImageFile,
  formatFileSize,
} from "@/lib/utils/imageCompression";
import { MyLoader } from "@/components/shared/MyLoader";
import { ROUTES } from "@/constants";
import { useAppToast } from "@/hooks/useAppToast";

export default function ProfilePage() {
  const { data: session, status } = useSession();
  const { validationError, actionError, infoMessage } = useAppToast();
  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState(session?.user?.name || "");
  const [email, setEmail] = useState(session?.user?.email || "");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { tasks } = useTasks();
  const { stats } = useStats();

  if (status === "loading") {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <MyLoader label="Loading" />
      </div>
    );
  }

  if (!session) {
    redirect(ROUTES.SIGN_IN);
  }

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!isValidImageFile(file)) {
        validationError(
          "Please select a valid image file (JPEG, PNG, WebP, or GIF).",
        );
        return;
      }

      const fileSizeMB = file.size / 1024 / 1024;
      if (fileSizeMB > 10) {
        validationError("Please select an image smaller than 10MB.");
        return;
      }

      try {
        const compressedFile = await compressImage(file, {
          maxWidthOrHeight: 400,
          maxSizeMB: 0.5,
          quality: 0.8,
        });

        console.log(`Original size: ${formatFileSize(file.size)}`);
        console.log(`Compressed size: ${formatFileSize(compressedFile.size)}`);

        setImageFile(compressedFile);
        const reader = new FileReader();
        reader.onload = (e) => {
          setImagePreview(e.target?.result as string);
        };
        reader.readAsDataURL(compressedFile);
      } catch (error) {
        console.error("Error compressing image:", error);
        actionError(
          error,
          "Failed to process image. Please try another image.",
        );
      }
    }
  };

  const handleSave = async () => {
    setIsLoading(true);
    try {
      const supabase = getSupabaseClientOrNull();
      if (!supabase) {
        actionError("Supabase is not configured.");
        return;
      }

      let imageUrl = session.user?.image;

      if (imageFile) {
        const fileExt = "jpg";
        const fileName = `${session.user?.id}_${Date.now()}.${fileExt}`;
        const { error } = await supabase.storage
          .from("avatars")
          .upload(fileName, imageFile);

        if (error) throw error;

        const {
          data: { publicUrl },
        } = supabase.storage.from("avatars").getPublicUrl(fileName);

        imageUrl = publicUrl;
      }

      const emailChanged = email !== session.user?.email;

      if (name !== session.user?.name || imageUrl !== session.user?.image) {
        const { error } = await supabase.auth.updateUser({
          data: {
            full_name: name,
            avatar_url: imageUrl,
          },
        });
        if (error) throw error;
      }

      if (emailChanged) {
        const { error } = await supabase.auth.updateUser(
          { email: email },
          {
            emailRedirectTo: `${window.location.origin}/verify-email`,
          },
        );

        if (error) throw error;

        infoMessage(
          `A verification email was sent to ${email}. Please check your inbox to confirm the change.`,
          "Verification Email",
        );
      }

      if (!emailChanged) {
        setIsEditing(false);
      }
      setImageFile(null);
      setImagePreview(null);
    } catch (error) {
      console.error("Error updating profile:", error);
      actionError(error, "Failed to updateSession profile.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
    setName(session?.user?.name || "");
    setEmail(session?.user?.email || "");
    setImageFile(null);
    setImagePreview(null);
  };

  const { completedTasks, completionRate, activeTasks } =
    getTaskCompletionStats(tasks);
  const totalFocusHours = getFocusHours(stats?.totalFocusTime);
  const domainDistribution = getDomainDistribution(tasks);

  return (
    <div>
      <ProfileHeader
        isEditing={isEditing}
        name={name}
        email={email}
        imagePreview={imagePreview}
        isLoading={isLoading}
        onImageChange={handleImageChange}
        onSave={handleSave}
        onCancel={handleCancel}
        onEditToggle={() => setIsEditing(true)}
      />

      <ProfileStatsGrid
        totalSessions={stats?.totalSessions || 0}
        completedTasks={completedTasks}
        totalFocusHours={totalFocusHours}
        currentStreak={stats?.streak || 0}
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ActivityOverview
          completionRate={completionRate}
          longestStreak={stats?.longestStreak || 0}
          activeTasks={activeTasks}
        />

        <DomainDistribution domains={domainDistribution} />
      </div>
    </div>
  );
}
