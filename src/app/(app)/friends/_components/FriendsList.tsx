/**
 * @fileoverview Friends list component
 */

"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import Card, { CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import { DYNAMIC_ROUTES } from "@/constants";

interface Friend {
  id: string;
  sender_id: string;
  receiver_id: string;
  receiver: {
    username: string | null;
    avatar_url: string | null;
  } | null;
  sender: {
    username: string | null;
    avatar_url: string | null;
  } | null;
  created_at: string;
}

interface FriendsListProps {
  friends: Friend[];
  currentUserId?: string;
  onRemoveFriend: (friendshipId: string) => void;
}

export function FriendsList({
  friends,
  currentUserId,
  onRemoveFriend,
}: FriendsListProps) {
  const router = useRouter();

  if (friends.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>My Friends ({friends.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-center text-muted-foreground py-8">
            No friends yet. Visit the leaderboard to find and add friends!
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>My Friends ({friends.length})</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {friends.map((friend) => {
            const friendUser =
              friend.sender_id === currentUserId
                ? friend.receiver
                : friend.sender;
            const friendId =
              friend.sender_id === currentUserId
                ? friend.receiver_id
                : friend.sender_id;

            return (
              <div
                key={friend.id}
                className="flex items-center justify-between p-4 rounded-lg border border-border hover:bg-muted/50 transition-colors cursor-pointer"
                onClick={() =>
                  router.push(DYNAMIC_ROUTES.USER_PROFILE(friendId))
                }
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                    {friendUser?.avatar_url ? (
                      <Image
                        src={friendUser.avatar_url}
                        alt={friendUser.username || "User"}
                        width={40}
                        height={40}
                        className="w-10 h-10 rounded-full"
                      />
                    ) : (
                      <span className="text-lg">
                        {(friendUser?.username || "A").charAt(0).toUpperCase()}
                      </span>
                    )}
                  </div>
                  <div>
                    <p className="font-medium">
                      {friendUser?.username || "Anonymous User"}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Friends since{" "}
                      {new Date(friend.created_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                    }}
                  >
                    View Profile
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      onRemoveFriend(friend.id);
                    }}
                    className="text-error hover:text-error-light"
                  >
                    Remove
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
