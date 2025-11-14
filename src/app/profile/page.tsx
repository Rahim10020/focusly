'use client';

import { useState, useRef } from 'react';
import { useSession, signIn } from 'next-auth/react';
import { redirect } from 'next/navigation';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import { supabase } from '../../lib/supabase';

export default function ProfilePage() {
    const { data: session, status, update } = useSession();
    const [isEditing, setIsEditing] = useState(false);
    const [name, setName] = useState(session?.user?.name || '');
    const [email, setEmail] = useState(session?.user?.email || '');
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    if (status === 'loading') {
        return <div className="flex justify-center items-center min-h-screen">Loading...</div>;
    }

    if (!session) {
        redirect('/auth/signin');
    }

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setImageFile(file);
            const reader = new FileReader();
            reader.onload = (e) => {
                setImagePreview(e.target?.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleSave = async () => {
        setIsLoading(true);
        try {
            let imageUrl = session.user?.image;

            if (imageFile) {
                const fileExt = imageFile.name.split('.').pop();
                const fileName = `${(session.user as any)?.id}_${Date.now()}.${fileExt}`;
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
            if (name !== session.user?.name) updates.data = { ...updates.data, name };
            if (email !== session.user?.email) updates.email = email;
            if (imageUrl !== session.user?.image) updates.data = { ...updates.data, image: imageUrl };

            if (Object.keys(updates).length > 0) {
                const { data, error } = await supabase.auth.updateUser(updates);
                if (error) throw error;

                // Update NextAuth session
                await update({
                    ...session,
                    user: {
                        ...session.user,
                        name: name,
                        email: email,
                        image: imageUrl,
                    },
                });
            }

            setIsEditing(false);
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

    return (
        <div className="max-w-2xl mx-auto p-6">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold">Profile</h1>
                {!isEditing && (
                    <Button onClick={() => setIsEditing(true)}>Edit Profile</Button>
                )}
            </div>
            <Card className="p-6">
                <div className="flex items-center gap-4 mb-6">
                    <div className="relative">
                        <img
                            src={imagePreview || session.user?.image || '/default-avatar.svg'}
                            alt="Profile"
                            className="w-16 h-16 rounded-full"
                        />
                        {isEditing && (
                            <button
                                onClick={() => fileInputRef.current?.click()}
                                className="absolute bottom-0 right-0 bg-primary text-primary-foreground rounded-full p-1 text-xs"
                            >
                                ✏️
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
                    <div className="flex-1">
                        {isEditing ? (
                            <Input
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                placeholder="Name"
                                className="mb-2"
                            />
                        ) : (
                            <h2 className="text-xl font-semibold">{session.user?.name}</h2>
                        )}
                        {isEditing ? (
                            <Input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="Email"
                            />
                        ) : (
                            <p className="text-muted-foreground">{session.user?.email}</p>
                        )}
                    </div>
                </div>
                {isEditing && (
                    <div className="flex gap-4">
                        <Button onClick={handleSave} disabled={isLoading}>
                            {isLoading ? 'Saving...' : 'Save'}
                        </Button>
                        <Button variant="secondary" onClick={handleCancel}>
                            Cancel
                        </Button>
                    </div>
                )}
            </Card>
        </div>
    );
}