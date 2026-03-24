/**
 * @fileoverview User profile page for the Focusly application.
 * Displays user information, avatar, stats, activity overview,
 * and domain distribution with profile editing capabilities.
 * @module app/profile/page
 */

"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { redirect } from "next/navigation";
import Header from "@/components/layout/Header";
import { ProfileHeader } from "@/components/profile/ProfileHeader";
import { ProfileStatsGrid } from "@/components/profile/ProfileStatsGrid";
import { ActivityOverview } from "@/components/profile/ActivityOverview";
import { DomainDistribution } from "@/components/profile/DomainDistribution";
import { supabaseClient as supabase } from "@/lib/supabase/client";
import { useTasks } from "@/lib/hooks/useTasks";
import { useStats } from "@/lib/hooks/useStats";
import { DOMAINS, getDomainFromSubDomain } from "@/types";
import {
  compressImage,
  isValidImageFile,
  formatFileSize,
} from "@/lib/utils/imageCompression";
import { MyLoader } from "@/components/ui/MyLoader";
import { ROUTES } from "@/components/shared/constants/routes";

interface DomainData {
  domain: string;
  count: number;
  completed: number;
}

export default function ProfilePage() {
  const { data: session, status, update } = useSession();
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
        alert("Please select a valid image file (JPEG, PNG, WebP, or GIF)");
        return;
      }

      const fileSizeMB = file.size / 1024 / 1024;
      if (fileSizeMB > 10) {
        alert(
          "Image file is too large. Please select an image smaller than 10MB.",
        );
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
        alert("Failed to process image. Please try another image.");
      }
    }
  };

  const handleSave = async () => {
    setIsLoading(true);
    try {
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

      const updates: { data: Record<string, unknown> } = { data: {} };
      const emailChanged = email !== session.user?.email;

      if (name !== session.user?.name) {
        updates.data = { ...updates.data, name };
      }

      if (emailChanged) {
        const { error } = await supabase.auth.updateUser(
          { email: email },
          {
            emailRedirectTo: `${window.location.origin}/auth/verify-email`,
          },
        );

        if (error) throw error;

        alert(
          `Verification email sent to ${email}. Please check your inbox to confirm the change.`,
        );
      }

      if (imageUrl !== session.user?.image) {
        updates.data = { ...updates.data, image: imageUrl };
      }

      if (Object.keys(updates).length > 0 && !emailChanged) {
        const { error } = await supabase.auth.updateUser(updates);
        if (error) throw error;

        await update({
          ...session,
          user: {
            ...session.user,
            name: name,
            email: emailChanged ? email : session.user?.email,
            image: imageUrl,
          },
        });
      } else if (Object.keys(updates).length > 0) {
        await update({
          ...session,
          user: {
            ...session.user,
            name: name,
            image: imageUrl,
          },
        });
      }

      if (!emailChanged) {
        setIsEditing(false);
      }
      setImageFile(null);
      setImagePreview(null);
    } catch (error) {
      console.error("Error updating profile:", error);
      alert("Error updating profile");
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

  // Calculate stats
  const completedTasks = tasks.filter((t) => t.completed).length;
  const totalTasks = tasks.length;
  const completionRate =
    totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
  const totalFocusHours = Math.round((stats?.totalFocusTime || 0) / 3600);

  // Calculate domain distribution
  const domainDistribution: DomainData[] = Object.keys(DOMAINS).map(
    (domainKey) => {
      const domainTasks = tasks.filter((task) => {
        if (!task.subDomain) return false;
        try {
          return getDomainFromSubDomain(task.subDomain) === domainKey;
        } catch {
          return false;
        }
      });
      return {
        domain: DOMAINS[domainKey as keyof typeof DOMAINS].name,
        count: domainTasks.length,
        completed: domainTasks.filter((t) => t.completed).length,
      };
    },
  );

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="max-w-6xl mx-auto px-6 py-8">
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
            activeTasks={totalTasks - completedTasks}
          />

          <DomainDistribution domains={domainDistribution} />
        </div>
      </main>
    </div>
  );
}
