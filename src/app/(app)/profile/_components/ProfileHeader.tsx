/**
 * @fileoverview Profile header component displaying user avatar, name, email, and edit controls.
 * @module components/profile/ProfileHeader
 */

"use client";

import { useRef } from "react";
import { useSession } from "@/hooks/useAuth";
import Image from "next/image";
import Card, { CardContent } from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import { MyLoader } from "@/components/shared/MyLoader";
import { EditPencilIcon, EditPencilLineIcon } from "@/components/shared/icons";

interface ProfileHeaderProps {
  isEditing: boolean;
  name: string;
  email: string;
  imagePreview: string | null;
  isLoading: boolean;
  onImageChange: (e: React.ChangeEvent<HTMLInputElement>) => Promise<void>;
  onSave: () => Promise<void>;
  onCancel: () => void;
  onEditToggle: () => void;
}

export function ProfileHeader({
  isEditing,
  name,
  email,
  imagePreview,
  isLoading,
  onImageChange,
  onSave,
  onCancel,
  onEditToggle,
}: ProfileHeaderProps) {
  const { data: session } = useSession();
  const fileInputRef = useRef<HTMLInputElement>(null);

  return (
    <div className="mb-8">
      <Card variant="none" className="relative overflow-hidden">
        {/* Cover gradient */}
        <div className="absolute inset-0 bg-linear-to-br from-primary/20 via-primary/10 to-transparent h-32"></div>

        <CardContent className="pt-20 pb-6 relative">
          <div className="flex flex-col md:flex-row items-start md:items-end gap-6">
            {/* Avatar */}
            <div className="relative -mt-16">
              <div className="relative">
                <Image
                  src={
                    imagePreview ||
                    session?.user?.image ||
                    "/default-avatar.svg"
                  }
                  alt="Profile"
                  width={128}
                  height={128}
                  className="w-32 h-32 rounded-full border-4 border-background shadow-lg object-cover"
                />
                {isEditing && (
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="absolute bottom-2 right-2 bg-primary text-primary-foreground rounded-full p-2 shadow-lg hover:scale-110 transition-transform cursor-pointer"
                  >
                    <EditPencilIcon size={16} />
                  </button>
                )}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={onImageChange}
                  className="hidden"
                />
              </div>
            </div>

            {/* User Info */}
            <div className="flex-1">
              {isEditing ? (
                <div className="space-y-3">
                  <Input
                    value={name}
                    onChange={() => {}}
                    placeholder="Name"
                    className="text-lg font-semibold"
                  />
                  <Input
                    type="email"
                    value={email}
                    onChange={() => {}}
                    placeholder="Email"
                  />
                </div>
              ) : (
                <>
                  <h1 className="text-3xl font-bold mb-1">
                    {session?.user?.name}
                  </h1>
                  <p className="text-muted-foreground mb-4">
                    {session?.user?.email}
                  </p>
                </>
              )}
            </div>

            {/* Edit Button */}
            <div className="flex gap-2">
              {isEditing ? (
                <>
                  <Button onClick={onSave} disabled={isLoading}>
                    {isLoading ? (
                      <MyLoader label="Saving changes" />
                    ) : (
                      "Save Changes"
                    )}
                  </Button>
                  <Button variant="secondary" onClick={onCancel}>
                    Cancel
                  </Button>
                </>
              ) : (
                <Button onClick={onEditToggle}>
                  <EditPencilLineIcon size={16} />
                  Edit Profile
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
