/**
 * @fileoverview User search component for finding friends
 */

"use client";

import Image from "next/image";
import Card, { CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";
import { MyLoader } from "../ui/MyLoader";

interface UserSearchResult {
  id: string;
  username: string | null;
  avatar_url?: string | null;
  stats?: {
    completed_tasks: number;
  };
}

interface UserSearchProps {
  searchQuery: string;
  searching: boolean;
  searchResults: UserSearchResult[];
  onSearchChange: (query: string) => void;
  onSendFriendRequest: (userId: string) => void;
}

export function UserSearch({
  searchQuery,
  searching,
  searchResults,
  onSearchChange,
  onSendFriendRequest,
}: UserSearchProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Find Friends</CardTitle>
      </CardHeader>
      <CardContent>
        <Input
          placeholder="Search users by username..."
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
        />
        {searching && (
          <div className="mt-4 text-center text-muted-foreground">
            <MyLoader label="Searching" />
          </div>
        )}
        {!searching && searchResults.length > 0 && (
          <div className="mt-4 space-y-2">
            {searchResults.map((user) => (
              <div
                key={user.id}
                className="flex items-center justify-between p-3 rounded-lg border border-border hover:bg-muted/50"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                    {user.avatar_url ? (
                      <Image
                        src={user.avatar_url}
                        alt={user.username || "User"}
                        width={40}
                        height={40}
                        className="w-10 h-10 rounded-full"
                      />
                    ) : (
                      <span className="text-lg">
                        {(user.username || "A").charAt(0).toUpperCase()}
                      </span>
                    )}
                  </div>
                  <div>
                    <p className="font-medium">
                      {user.username || "Anonymous User"}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {user.stats?.completed_tasks || 0} tasks completed
                    </p>
                  </div>
                </div>
                <Button onClick={() => onSendFriendRequest(user.id)} size="sm">
                  Add Friend
                </Button>
              </div>
            ))}
          </div>
        )}
        {!searching && searchQuery && searchResults.length === 0 && (
          <p className="mt-4 text-center text-muted-foreground">
            No users found
          </p>
        )}
      </CardContent>
    </Card>
  );
}
