'use client';

import { useSession } from 'next-auth/react';
import { redirect } from 'next/navigation';
import Card from '../../components/ui/Card';

export default function ProfilePage() {
    const { data: session, status } = useSession();

    if (status === 'loading') {
        return <div className="flex justify-center items-center min-h-screen">Loading...</div>;
    }

    if (!session) {
        redirect('/auth/signin');
    }

    return (
        <div className="max-w-2xl mx-auto p-6">
            <h1 className="text-2xl font-bold mb-6">Profile</h1>
            <Card className="p-6">
                <div className="flex items-center gap-4 mb-6">
                    <img
                        src={session.user?.image || '/default-avatar.svg'}
                        alt="Profile"
                        className="w-16 h-16 rounded-full"
                    />
                    <div>
                        <h2 className="text-xl font-semibold">{session.user?.name}</h2>
                        <p className="text-muted-foreground">{session.user?.email}</p>
                    </div>
                </div>
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium mb-1">Name</label>
                        <p className="text-foreground">{session.user?.name || 'Not provided'}</p>
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1">Email</label>
                        <p className="text-foreground">{session.user?.email}</p>
                    </div>
                    {/* Add more profile fields as needed */}
                </div>
            </Card>
        </div>
    );
}