'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function CreateTaskPage() {
    const router = useRouter();

    useEffect(() => {
        // Redirect to new task creation page
        router.replace('/task/new');
    }, [router]);

    return (
        <div className="min-h-screen bg-background flex items-center justify-center">
            <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                <p>Redirecting...</p>
            </div>
        </div>
    );
}
