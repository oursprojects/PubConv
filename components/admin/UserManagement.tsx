"use client";

import { useState, useEffect } from "react";
import * as React from "react";
import { InitialsAvatar } from "@/components/ui/initials-avatar";
import { AnimatedButton } from "@/components/ui/animated-button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Loader2, Search, Ban, CheckCircle, Trash2, AlertTriangle } from "lucide-react";
import { toggleBanUser, getUsers, deleteUser } from "@/app/(main)/admin/actions";
import { useAdminBroadcast } from "@/hooks/useAdminBroadcast";
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

interface UserManagementProps {
    initialUsers: any[];
    onUserChange?: (userId: string, isBanned: boolean) => void;
    onUserDelete?: (userId: string) => void;
}

export function UserManagement({ initialUsers, onUserChange, onUserDelete }: UserManagementProps) {
    const [users, setUsers] = useState(initialUsers);
    const [query, setQuery] = useState("");
    const [loading, setLoading] = useState(false);
    const [actionLoading, setActionLoading] = useState<string | null>(null);
    const { broadcastUserBanned, broadcastUserDeleted } = useAdminBroadcast();

    // Sync users when initialUsers updates (e.g. after server action revalidation)
    useEffect(() => {
        setUsers(initialUsers);
    }, [initialUsers]);

    const handleSearch = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        const data = await getUsers(query);
        setUsers(data);
        setLoading(false);
    };

    const handleBanToggle = async (userId: string, currentStatus: boolean) => {
        setActionLoading(userId);
        try {
            const result = await toggleBanUser(userId, !currentStatus);
            if (result.success) {
                // Optimistic update
                const newStatus = !currentStatus;
                setUsers(users.map(u => u.id === userId ? { ...u, is_banned: newStatus } : u));
                if (onUserChange) onUserChange(userId, newStatus);

                // Broadcast ban if banning (not unbanning)
                if (!currentStatus) {
                    try {
                        await broadcastUserBanned(userId);
                    } catch (err) {
                        console.error("Broadcast failed:", err);
                    }
                }
            } else {
                console.error(result.error);
            }
        } catch (error) {
            console.error("Ban action failed:", error);
        }
        setActionLoading(null);
    };

    const handleDeleteUser = async (userId: string) => {
        setActionLoading(userId);
        try {
            // Broadcast delete before action (so user sees it immediately)
            try {
                await broadcastUserDeleted(userId);
            } catch (err) {
                console.error("Broadcast failed:", err);
            }

            const result = await deleteUser(userId);
            if (result.success) {
                setUsers(users.filter(u => u.id !== userId));
                if (onUserDelete) onUserDelete(userId);
            } else {
                console.error(result.error);
            }
        } catch (error) {
            console.error("Delete action failed:", error);
        }
        setActionLoading(null);
    };

    return (
        <div className="flex flex-col h-full gap-4 p-2 md:p-6">
            <form onSubmit={handleSearch} className="flex gap-2 shrink-0">
                <Input
                    placeholder="Search users..."
                    value={query}
                    onChange={e => setQuery(e.target.value)}
                    className="max-w-sm bg-background border-border"
                />
                <AnimatedButton type="submit" disabled={loading} variant="secondary">
                    {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
                </AnimatedButton>
            </form>

            <div className="rounded-md border border-border flex-1 overflow-auto min-h-0 relative">
                <Table>
                    <TableHeader className="sticky top-0 bg-background z-10 shadow-sm">
                        <TableRow>
                            <TableHead className="w-full">User</TableHead>
                            <TableHead className="hidden md:table-cell">Role</TableHead>
                            <TableHead className="hidden md:table-cell">Status</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {users.map((user) => (
                            <TableRow key={user.id}>
                                <TableCell className="flex items-center gap-2 md:gap-3 p-2 md:p-4">
                                    <InitialsAvatar
                                        username={user.username || "?"}
                                        size="sm"
                                        isAdmin={user.role === 'admin'}
                                    />
                                    <div className="flex flex-col">
                                        <span className="font-medium text-foreground text-sm md:text-base">{user.username}</span>
                                        {/* Show status/role as subtitle on mobile */}
                                        <div className="flex items-center gap-2 md:hidden">
                                            <span className="text-xs text-muted-foreground capitalize">{user.role}</span>
                                            <span className="text-xs text-muted-foreground">•</span>
                                            <span className={`text-xs ${user.is_banned ? 'text-destructive' : 'text-green-600'}`}>
                                                {user.is_banned ? 'Banned' : 'Active'}
                                            </span>
                                        </div>
                                    </div>
                                </TableCell>
                                <TableCell className="hidden md:table-cell capitalize text-muted-foreground p-2 md:p-4">{user.role}</TableCell>
                                <TableCell className="hidden md:table-cell p-2 md:p-4">
                                    {user.is_banned ? (
                                        <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200">
                                            Banned
                                        </span>
                                    ) : (
                                        <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                                            Active
                                        </span>
                                    )}
                                </TableCell>
                                <TableCell className="text-right p-2 md:p-4">
                                    <div className="flex justify-end gap-2">
                                        {/* Ban/Unban Dialog */}
                                        <AlertDialog>
                                            <AlertDialogTrigger asChild>
                                                <AnimatedButton
                                                    size="sm"
                                                    variant={user.is_banned ? "outline" : "secondary"}
                                                    disabled={user.role === 'admin' || actionLoading === user.id}
                                                >
                                                    {actionLoading === user.id ? (
                                                        <Loader2 className="h-4 w-4 animate-spin" />
                                                    ) : user.is_banned ? (
                                                        <>
                                                            <CheckCircle className="h-4 w-4 md:mr-2" /> <span className="hidden md:inline">Unban</span>
                                                        </>
                                                    ) : (
                                                        <>
                                                            <Ban className="h-4 w-4 md:mr-2" /> <span className="hidden md:inline">Ban</span>
                                                        </>
                                                    )}
                                                </AnimatedButton>
                                            </AlertDialogTrigger>
                                            <AlertDialogContent>
                                                <AlertDialogHeader>
                                                    <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                                                    <AlertDialogDescription>
                                                        This will {user.is_banned ? "unban" : "ban"} the user <strong>{user.username}</strong>.
                                                        {user.is_banned ? " They will regain access to the platform." : " They will lose access to the platform immediately."}
                                                    </AlertDialogDescription>
                                                </AlertDialogHeader>
                                                <AlertDialogFooter>
                                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                                    <AlertDialogAction onClick={() => handleBanToggle(user.id, user.is_banned)}>
                                                        Confirm
                                                    </AlertDialogAction>
                                                </AlertDialogFooter>
                                            </AlertDialogContent>
                                        </AlertDialog>

                                        {/* Delete Dialog */}
                                        <AlertDialog>
                                            <AlertDialogTrigger asChild>
                                                <AnimatedButton
                                                    size="sm"
                                                    variant="destructive"
                                                    disabled={user.role === 'admin' || actionLoading === user.id}
                                                >
                                                    {actionLoading === user.id ? (
                                                        <Loader2 className="h-4 w-4 animate-spin" />
                                                    ) : (
                                                        <Trash2 className="h-4 w-4" />
                                                    )}
                                                </AnimatedButton>
                                            </AlertDialogTrigger>
                                            <AlertDialogContent>
                                                <AlertDialogHeader>
                                                    <AlertDialogTitle className="text-destructive flex items-center gap-2">
                                                        <AlertTriangle className="h-5 w-5" /> Delete User
                                                    </AlertDialogTitle>
                                                    <AlertDialogDescription>
                                                        This action cannot be undone. This will permanently delete the user account
                                                        <strong> {user.username}</strong> and remove their data from our servers.
                                                    </AlertDialogDescription>
                                                </AlertDialogHeader>
                                                <AlertDialogFooter>
                                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                                    <AlertDialogAction
                                                        onClick={() => handleDeleteUser(user.id)}
                                                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                                    >
                                                        Delete Account
                                                    </AlertDialogAction>
                                                </AlertDialogFooter>
                                            </AlertDialogContent>
                                        </AlertDialog>
                                    </div>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>
        </div>
    );
}
