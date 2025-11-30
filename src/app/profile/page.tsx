/**
 * @fileoverview User profile page for the Focusly application.
 * Displays user information, avatar, stats, activity overview,
 * and domain distribution with profile editing capabilities.
 * @module app/profile/page
 */

'use client';

import { useState, useRef } from 'react';
import { useSession, signIn } from 'next-auth/react';
import { redirect } from 'next/navigation';
import Header from '@/components/layout/Header';
import Card, { CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import { supabaseClient as supabase } from '@/lib/supabase/client';
import { useTasks } from '@/lib/hooks/useTasks';
import { useStats } from '@/lib/hooks/useStats';
import { DOMAINS, getDomainFromSubDomain } from '@/types';
import { compressImage, isValidImageFile, formatFileSize } from '@/lib/utils/imageCompression';

/**
 * Profile page component displaying user information and statistics.
 * Allows users to edit their name, email, and avatar image.
 * Shows stats overview, activity metrics, and domain distribution.
 *
 * @returns {JSX.Element} The rendered profile page
 */
export default function ProfilePage() {
    const { data: session, status, update } = useSession();
    const [isEditing, setIsEditing] = useState(false);
    const [name, setName] = useState(session?.user?.name || '');
    const [email, setEmail] = useState(session?.user?.email || '');
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [emailVerificationSent, setEmailVerificationSent] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const { tasks } = useTasks();
    const { stats, sessions } = useStats();

    if (status === 'loading') {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                    <p>Loading...</p>
                </div>
            </div>
        );
    }

    if (!session) {
        redirect('/auth/signin');
    }

    const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            // Validate file type
            if (!isValidImageFile(file)) {
                alert('Please select a valid image file (JPEG, PNG, WebP, or GIF)');
                return;
            }

            // Check file size before compression
            const fileSizeMB = file.size / 1024 / 1024;
            if (fileSizeMB > 10) {
                alert('Image file is too large. Please select an image smaller than 10MB.');
                return;
            }

            try {
                // Compress the image
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
                console.error('Error compressing image:', error);
                alert('Failed to process image. Please try another image.');
            }
        }
    };

    const handleSave = async () => {
        setIsLoading(true);
        setEmailVerificationSent(false);
        try {
            let imageUrl = session.user?.image;

            // Upload compressed image if changed
            if (imageFile) {
                const fileExt = 'jpg'; // Always use jpg since we compress to JPEG
                const fileName = `${session.user?.id}_${Date.now()}.${fileExt}`;
                const { data, error } = await supabase.storage
                    .from('avatars')
                    .upload(fileName, imageFile);

                if (error) throw error;

                const { data: { publicUrl } } = supabase.storage
                    .from('avatars')
                    .getPublicUrl(fileName);

                imageUrl = publicUrl;
            }

            const updates: any = {};
            const emailChanged = email !== session.user?.email;

            // Handle name update
            if (name !== session.user?.name) {
                updates.data = { ...updates.data, name };
            }

            // Handle email update with verification
            if (emailChanged) {
                const { error } = await supabase.auth.updateUser(
                    { email: email },
                    {
                        emailRedirectTo: `${window.location.origin}/auth/verify-email`
                    }
                );

                if (error) throw error;

                setEmailVerificationSent(true);
                alert(`Verification email sent to ${email}. Please check your inbox to confirm the change.`);
            }

            // Handle image update
            if (imageUrl !== session.user?.image) {
                updates.data = { ...updates.data, image: imageUrl };
            }

            // Update name/image if changed (email already updated above)
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
                // Just update name/image in session
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
            console.error('Error updating profile:', error);
            alert('Error updating profile');
        } finally {
            setIsLoading(false);
        }
    };

    const handleCancel = () => {
        setIsEditing(false);
        setName(session?.user?.name || '');
        setEmail(session?.user?.email || '');
        setImageFile(null);
        setImagePreview(null);
    };

    // Calculate stats
    const completedTasks = tasks.filter(t => t.completed).length;
    const totalTasks = tasks.length;
    const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
    const totalFocusHours = Math.round((stats?.totalFocusTime || 0) / 3600);

    // Calculate domain distribution
    const domainDistribution = Object.keys(DOMAINS).map((domainKey) => {
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
            completed: domainTasks.filter(t => t.completed).length,
        };
    });

    return (
        <div className="min-h-screen bg-background">
            <Header />

            <main className="max-w-6xl mx-auto px-6 py-8">
                {/* Profile Header */}
                <div className="mb-8">
                    <Card variant="none" className="relative overflow-hidden">
                        {/* Cover gradient */}
                        <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-primary/10 to-transparent h-32"></div>

                        <CardContent className="pt-20 pb-6 relative">
                            <div className="flex flex-col md:flex-row items-start md:items-end gap-6">
                                {/* Avatar */}
                                <div className="relative -mt-16">
                                    <div className="relative">
                                        <img
                                            src={imagePreview || session.user?.image || '/default-avatar.svg'}
                                            alt="Profile"
                                            className="w-32 h-32 rounded-full border-4 border-background shadow-xl object-cover"
                                        />
                                        {isEditing && (
                                            <button
                                                onClick={() => fileInputRef.current?.click()}
                                                className="absolute bottom-2 right-2 bg-primary text-primary-foreground rounded-full p-2 shadow-lg hover:scale-110 transition-transform cursor-pointer"
                                            >
                                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                    <path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"></path>
                                                </svg>
                                            </button>
                                        )}
                                        <input
                                            ref={fileInputRef}
                                            type="file"
                                            accept="image/*"
                                            onChange={handleImageChange}
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
                                                onChange={(e) => setName(e.target.value)}
                                                placeholder="Name"
                                                className="text-lg font-semibold"
                                            />
                                            <Input
                                                type="email"
                                                value={email}
                                                onChange={(e) => setEmail(e.target.value)}
                                                placeholder="Email"
                                            />
                                        </div>
                                    ) : (
                                        <>
                                            <h1 className="text-3xl font-bold mb-1">{session.user?.name}</h1>
                                            <p className="text-muted-foreground mb-4">{session.user?.email}</p>
                                        </>
                                    )}
                                </div>

                                {/* Edit Button */}
                                <div className="flex gap-2">
                                    {isEditing ? (
                                        <>
                                            <Button onClick={handleSave} disabled={isLoading}>
                                                {isLoading ? 'Saving...' : 'Save Changes'}
                                            </Button>
                                            <Button variant="secondary" onClick={handleCancel}>
                                                Cancel
                                            </Button>
                                        </>
                                    ) : (
                                        <Button onClick={() => setIsEditing(true)}>
                                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2">
                                                <path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"></path>
                                            </svg>
                                            Edit Profile
                                        </Button>
                                    )}
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                    <Card variant="default">
                        <CardContent className="pt-6">
                            <div className="text-center">
                                <div className="w-12 h-12 rounded-full mx-auto mb-3 flex items-center justify-center">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-primary">
                                        <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline>
                                    </svg>
                                </div>
                                <p className="text-3xl font-bold mb-1">{stats?.totalSessions || 0}</p>
                                <p className="text-sm text-muted-foreground">Total Sessions</p>
                            </div>
                        </CardContent>
                    </Card>

                    <Card variant="default">
                        <CardContent className="pt-6">
                            <div className="text-center">
                                <div className="w-12 h-12 rounded-full mx-auto mb-3 flex items-center justify-center">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-green-500">
                                        <polyline points="20 6 9 17 4 12"></polyline>
                                    </svg>
                                </div>
                                <p className="text-3xl font-bold mb-1">{completedTasks}</p>
                                <p className="text-sm text-muted-foreground">Tasks Completed</p>
                            </div>
                        </CardContent>
                    </Card>

                    <Card variant="default">
                        <CardContent className="pt-6">
                            <div className="text-center">
                                <div className="w-12 h-12 rounded-full mx-auto mb-3 flex items-center justify-center">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-amber-500">
                                        <circle cx="12" cy="12" r="10"></circle>
                                        <polyline points="12 6 12 12 16 14"></polyline>
                                    </svg>
                                </div>
                                <p className="text-3xl font-bold mb-1">{totalFocusHours}h</p>
                                <p className="text-sm text-muted-foreground">Total Focus Time</p>
                            </div>
                        </CardContent>
                    </Card>

                    <Card variant="default">
                        <CardContent className="pt-6">
                            <div className="text-center">
                                <div className="w-12 h-12 rounded-full mx-auto mb-3 flex items-center justify-center">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-red-500">
                                        <path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z"></path>
                                    </svg>
                                </div>
                                <p className="text-3xl font-bold mb-1">{stats?.streak || 0}</p>
                                <p className="text-sm text-muted-foreground">Day Streak</p>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Activity Overview */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Activity Overview</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-full flex items-center justify-center">
                                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-primary">
                                                <circle cx="12" cy="12" r="10"></circle>
                                                <line x1="12" y1="8" x2="12" y2="12"></line>
                                                <line x1="12" y1="16" x2="12.01" y2="16"></line>
                                            </svg>
                                        </div>
                                        <div>
                                            <p className="font-medium">Completion Rate</p>
                                            <p className="text-sm text-muted-foreground">{completionRate}% of tasks</p>
                                        </div>
                                    </div>
                                    <div className="text-2xl font-bold">{completionRate}%</div>
                                </div>

                                <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-full flex items-center justify-center">
                                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-green-500">
                                                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                                                <polyline points="22 4 12 14.01 9 11.01"></polyline>
                                            </svg>
                                        </div>
                                        <div>
                                            <p className="font-medium">Longest Streak</p>
                                            <p className="text-sm text-muted-foreground">Best performance</p>
                                        </div>
                                    </div>
                                    <div className="text-2xl font-bold">{stats?.longestStreak || 0} days</div>
                                </div>

                                <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-full flex items-center justify-center">
                                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-amber-500">
                                                <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path>
                                            </svg>
                                        </div>
                                        <div>
                                            <p className="font-medium">Active Tasks</p>
                                            <p className="text-sm text-muted-foreground">In progress</p>
                                        </div>
                                    </div>
                                    <div className="text-2xl font-bold">{totalTasks - completedTasks}</div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Domain Distribution */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Domain Distribution</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-3">
                                {domainDistribution.map((domain, index) => (
                                    <div key={index} className="space-y-2">
                                        <div className="flex items-center justify-between text-sm">
                                            <span className="font-medium">{domain.domain.split('(')[0].trim()}</span>
                                            <span className="text-muted-foreground">
                                                {domain.completed}/{domain.count}
                                            </span>
                                        </div>
                                        <div className="w-full bg-muted rounded-full h-2">
                                            <div
                                                className="bg-primary h-2 rounded-full transition-all"
                                                style={{
                                                    width: `${domain.count > 0 ? (domain.completed / domain.count) * 100 : 0}%`
                                                }}
                                            ></div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </main>
        </div>
    );
}
