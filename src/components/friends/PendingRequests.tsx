/**
 * @fileoverview Pending friend requests component
 */

'use client';

import Image from 'next/image';
import Card, { CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import Button from '@/components/ui/Button';

interface PendingRequest {
  id: string;
  sender: {
    username: string | null;
    avatar_url: string | null;
  } | null;
}

interface PendingRequestsProps {
  requests: PendingRequest[];
  processingRequests: Set<string>;
  onAccept: (requestId: string) => void;
  onReject: (requestId: string) => void;
}

export function PendingRequests({ requests, processingRequests, onAccept, onReject }: PendingRequestsProps) {
  if (requests.length === 0) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Friend Requests</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {requests.map((request) => (
            <div
              key={request.id}
              className="flex items-center justify-between p-4 rounded-lg border border-border"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                  {request.sender?.avatar_url ? (
                    <Image
                      src={request.sender.avatar_url}
                      alt={request.sender.username || 'User'}
                      width={40}
                      height={40}
                      className="w-10 h-10 rounded-full"
                    />
                  ) : (
                    <span className="text-lg">
                      {(request.sender?.username || 'A').charAt(0).toUpperCase()}
                    </span>
                  )}
                </div>
                <div>
                  <p className="font-medium">
                    {request.sender?.username || 'Anonymous User'}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Sent you a friend request
                  </p>
                </div>
              </div>
              <div className="flex gap-2">
                <Button
                  onClick={() => onAccept(request.id)}
                  disabled={processingRequests.has(request.id)}
                  size="sm"
                >
                  {processingRequests.has(request.id) ? 'Accepting...' : 'Accept'}
                </Button>
                <Button
                  onClick={() => onReject(request.id)}
                  disabled={processingRequests.has(request.id)}
                  variant="secondary"
                  size="sm"
                >
                  {processingRequests.has(request.id) ? 'Rejecting...' : 'Reject'}
                </Button>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
