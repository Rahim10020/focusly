/**
 * @fileoverview Profile header component displaying user avatar, name, email, and edit controls.
 */

"use client";

import { useRef } from "react";
import { useSession } from "@/hooks/useAuth";
import Image from "next/image";
import Card, { CardContent } from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import { MyLoader } from "@/components/shared/MyLoader";

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
      <Card variant="outline">
        <CardContent className="pt-6 pb-6">
          <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
            <div className="relative mx-auto md:mx-0">
              <Image
                src={
                  imagePreview || session?.user?.image || "/default-avatar.svg"
                }
                alt="Profile"
                width={96}
                height={96}
                className="w-24 h-24 rounded-full border-2 border-border object-cover"
              />
              {isEditing && (
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="absolute inset-0 flex items-center justify-center bg-black/40 rounded-full text-white text-xs font-medium opacity-0 hover:opacity-100 transition-opacity cursor-pointer"
                >
                  Change
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

            <div className="flex-1 text-center md:text-left">
              {isEditing ? (
                <div className="space-y-3 max-w-md">
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
                  <h1 className="text-2xl font-bold mb-1">
                    {session?.user?.name}
                  </h1>
                  <p className="text-muted-foreground text-sm">
                    {session?.user?.email}
                  </p>
                </>
              )}
            </div>

            <div className="flex gap-2 mx-auto md:mx-0">
              {isEditing ? (
                <>
                  <Button onClick={onSave} disabled={isLoading} size="sm">
                    {isLoading ? (
                      <MyLoader label="Saving changes" />
                    ) : (
                      "Save Changes"
                    )}
                  </Button>
                  <Button variant="secondary" onClick={onCancel} size="sm">
                    Cancel
                  </Button>
                </>
              ) : (
                <Button onClick={onEditToggle} variant="outline" size="sm">
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
