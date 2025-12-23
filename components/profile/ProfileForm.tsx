"use client";

import { useRouter } from "next/navigation";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { useState, useRef } from "react";
import { Save, Upload, Loader2 } from "lucide-react";
import { updateProfileClient, deleteAvatarClient } from "@/lib/profile-client";

import { AnimatedButton } from "@/components/ui/animated-button";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

import { AvatarEditor } from "./AvatarEditor";

export function ProfileForm({ profile, user }: { profile: any, user: any }) {
    const router = useRouter();
    const [message, setMessage] = useState<{ type: 'error' | 'success', text: string } | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string | null>(profile?.avatar_url || null);
    const [selectedFile, setSelectedFile] = useState<Blob | null>(null);
    const [loading, setLoading] = useState(false);

    // Controlled inputs for tracking changes
    const [bio, setBio] = useState(profile?.bio || "");
    const [initialBio, setInitialBio] = useState(profile?.bio || "");

    // Is Dirty Calculation
    const isDirty = (bio !== initialBio) || (selectedFile !== null);

    // Cooldown Calculation
    const lastUpdate = profile?.last_avatar_update ? new Date(profile.last_avatar_update) : null;
    const now = new Date();
    const diffHours = lastUpdate ? (now.getTime() - lastUpdate.getTime()) / (1000 * 60 * 60) : 72;
    const isCooldownActive = diffHours < 72;
    const daysRemaining = isCooldownActive ? Math.ceil((72 - diffHours) / 24) : 0;

    // Editor State
    const [editorOpen, setEditorOpen] = useState(false);
    const [editorImage, setEditorImage] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    async function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
        if (event.target.files && event.target.files[0]) {
            const file = event.target.files[0];
            try {
                const objectUrl = URL.createObjectURL(file);
                setEditorImage(objectUrl);
                setEditorOpen(true);

                // Clear input so same file can be selected again if cancelled
                event.target.value = '';
            } catch (error) {
                console.error("Error reading image:", error);
                setMessage({ type: 'error', text: "Failed to read image. Please try another." });
            }
        }
    }

    function handleEditorSave(croppedBlob: Blob) {
        setSelectedFile(croppedBlob);

        const objectUrl = URL.createObjectURL(croppedBlob);
        setPreviewUrl(objectUrl);

        setEditorOpen(false);
        setEditorImage(null);
    }

    function handleEditorClose() {
        setEditorOpen(false);
        setEditorImage(null);
    }

    async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault();
        setMessage(null);
        setLoading(true);

        // Use state bio instead of formData
        const avatarFile = selectedFile ? new File([selectedFile], 'avatar.webp', { type: 'image/webp' }) : null;

        const res = await updateProfileClient(bio, avatarFile);
        setLoading(false);

        if (res?.error) {
            setMessage({ type: 'error', text: res.error });
        } else if (res?.success) {
            setMessage({ type: 'success', text: "Profile updated successfully!" });

            // Update initial state to match current, so button disables again
            setInitialBio(bio);
            setSelectedFile(null);

            // Don't full refresh to avoid "reloading" feel. 
            // We just updated local state, which is good enough for now. 
            // If we needed to update the header avatar, we might need a context update or router.refresh() 
            // but user specifically asked to fix "reloading" feeling.
            // router.refresh(); 
        }
    }

    async function handleDeleteConfirmed() {
        setLoading(true);
        const res = await deleteAvatarClient();
        setLoading(false);

        if (res?.error) {
            setMessage({ type: 'error', text: res.error });
        } else {
            setMessage({ type: 'success', text: "Avatar removed." });
            setPreviewUrl(null);
            setSelectedFile(null);
            // router.refresh(); // Avoid refresh
        }
    }

    return (
        <>
            <form onSubmit={handleSubmit} className="space-y-4">
                <div className="flex flex-col sm:flex-row gap-6 items-center sm:items-start">
                    <div className="relative group">
                        <Avatar className="h-24 w-24 cursor-pointer hover:opacity-90 transition-opacity">
                            <AvatarImage src={previewUrl || ""} className="object-cover" />
                            <AvatarFallback className="text-3xl bg-primary text-primary-foreground">
                                {profile?.username?.[0]?.toUpperCase()}
                            </AvatarFallback>
                        </Avatar>
                        {/* Only show "Change" if NOT on cooldown */}
                        {!isCooldownActive ? (
                            <>
                                <Label
                                    htmlFor="avatar-upload"
                                    className="absolute inset-x-0 bottom-0 bg-black/60 text-white text-[10px] text-center py-1 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer rounded-b-full"
                                >
                                    Change
                                </Label>
                                <Input
                                    ref={fileInputRef}
                                    id="avatar-upload"
                                    type="file"
                                    accept="image/*"
                                    className="hidden"
                                    onChange={handleFileChange}
                                    disabled={isCooldownActive}
                                />
                            </>
                        ) : (
                            <div className="absolute inset-x-0 bottom-0 bg-red-500/80 text-white text-[10px] text-center py-1 rounded-b-full cursor-not-allowed">
                                {daysRemaining}d wait
                            </div>
                        )}
                    </div>

                    <div className="flex flex-col gap-1 pt-2 text-center sm:text-left">
                        <h2 className="text-xl font-bold">{profile?.username}</h2>
                        <div className="flex flex-col gap-2">
                            <p className="text-muted-foreground text-sm">Update your personal details below.</p>
                            {/* Delete Button - Always allowed, even if on cooldown */}
                            {profile?.avatar_url && (
                                <AlertDialog>
                                    <AlertDialogTrigger asChild>
                                        <Button
                                            type="button"
                                            variant="destructive"
                                            size="sm"
                                            className="w-fit text-xs h-7 px-2"
                                        >
                                            Remove Photo
                                        </Button>
                                    </AlertDialogTrigger>
                                    <AlertDialogContent>
                                        <AlertDialogHeader>
                                            <AlertDialogTitle>Delete Profile Photo?</AlertDialogTitle>
                                            <AlertDialogDescription>
                                                This will remove your current avatar. You won't be able to upload a new one until your 3-day cooldown expires.
                                            </AlertDialogDescription>
                                        </AlertDialogHeader>
                                        <AlertDialogFooter>
                                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                                            <AlertDialogAction onClick={handleDeleteConfirmed} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                                                Delete
                                            </AlertDialogAction>
                                        </AlertDialogFooter>
                                    </AlertDialogContent>
                                </AlertDialog>
                            )}
                        </div>
                        <p className={isCooldownActive ? "text-xs text-red-500 font-medium mt-1" : "text-xs text-muted-foreground mt-1"}>
                            {isCooldownActive
                                ? `Avatar update locked for ${daysRemaining} more day${daysRemaining > 1 ? 's' : ''}.`
                                : "Avatar changes are limited to once every 3 days."
                            }
                            <br />
                            Images are auto-resized for efficiency.
                        </p>
                    </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="grid gap-2">
                        <Label htmlFor="username">Username</Label>
                        <Input
                            value={profile?.username || ""}
                            disabled
                            readOnly
                            className="bg-muted"
                        />
                    </div>

                    <div className="grid gap-2">
                        <Label htmlFor="bio">Bio</Label>
                        <Input
                            id="bio"
                            name="bio"
                            value={bio}
                            onChange={(e) => setBio(e.target.value)}
                            placeholder="Tell us about yourself..."
                        />
                    </div>
                </div>

                {message && (
                    <p className={message.type === 'error' ? "text-red-500 text-sm font-medium" : "text-green-500 text-sm font-medium"}>
                        {message.text}
                    </p>
                )}

                <AnimatedButton type="submit" disabled={loading || !isDirty} className="w-full sm:w-auto gap-2">
                    {loading ? (
                        <>
                            <Loader2 className="h-4 w-4 animate-spin" />
                            {selectedFile ? "Uploading..." : "Saving..."}
                        </>
                    ) : selectedFile ? (
                        <>
                            <Upload className="h-4 w-4" />
                            Upload and Save
                        </>
                    ) : (
                        <>
                            <Save className={!isDirty ? "h-4 w-4 opacity-50" : "h-4 w-4"} />
                            Save Changes
                        </>
                    )}
                </AnimatedButton>
            </form>

            <AvatarEditor
                open={editorOpen}
                imageSrc={editorImage}
                onClose={handleEditorClose}
                onSave={handleEditorSave}
            />
        </>
    );
}
