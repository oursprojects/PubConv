"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { Home, MessageSquare, User, Search, MessageCircle, LogOut, Loader2, Info, X, ShieldCheck, LayoutGrid, Palette, CalendarDays } from "lucide-react";
import { cn } from "@/lib/utils";
import { AnimatedButton } from "@/components/ui/animated-button";
import { createClient } from "@/lib/supabase/client";
import { InitialsAvatar } from "@/components/ui/initials-avatar";
import { ThemeToggle } from "@/components/theme-toggle";
import { InstallPWA } from "@/components/pwa-install-button";
import { toast } from "sonner";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import { ThemeSelector } from "@/components/user/ThemeSelector";

const navItems = [
    { href: "/", icon: Home, label: "Home" },
    { href: "/chat", icon: MessageSquare, label: "Global Chat" },
    { href: "/calendar", icon: CalendarDays, label: "Calendar" },
    { href: "/search", icon: Search, label: "Discover" },
    { href: "/profile", icon: User, label: "Profile" },
    { href: "/feedback", icon: MessageCircle, label: "Feedback" },
];

export function TopHeader({ user, role, avatarUrl: profileAvatarUrl }: { user?: any, role?: string, avatarUrl?: string | null }) {
    const pathname = usePathname();
    const router = useRouter();
    const [isLoggingOut, setIsLoggingOut] = React.useState(false);
    const [isOpen, setIsOpen] = React.useState(false);

    const handleLogout = async () => {
        // Show confirmation dialog
        const { swalConfirm } = await import('@/lib/swal');
        const result = await swalConfirm(
            'Sign Out?',
            'Are you sure you want to sign out?',
            {
                confirmButtonText: 'Yes, Sign Out',
                cancelButtonText: 'Cancel',
            }
        );

        if (!result.isConfirmed) return;

        setIsLoggingOut(true);
        toast.loading("Signing out...");
        const supabase = createClient();
        await supabase.auth.signOut();
        toast.dismiss();
        toast.success("Signed out successfully!");
        router.push("/login");
    };

    const displayName = user?.user_metadata?.display_name || user?.email?.split("@")[0] || "User";

    // Prefer the database URL (passed as prop), then metadata
    const rawAvatarUrl = profileAvatarUrl || user?.user_metadata?.avatar_url;

    // Filter out dicebear legacy URLs
    const avatarUrl = (rawAvatarUrl && !rawAvatarUrl.includes('dicebear')) ? rawAvatarUrl : null;

    return (
        <header className="sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 transform-gpu pt-[env(safe-area-inset-top)]">
            <div className="container flex h-14 items-center px-4 md:px-6 transform-gpu">
                <Link href="/" className="flex items-center gap-2 font-semibold">
                    <img src="/logo.png" alt="PubConv" className="h-6 w-auto" />
                    <span className="md:inline-block font-bold font-poppins">PubConv</span>
                </Link>

                {/* Current Date */}
                <div className="hidden md:flex items-center ml-4 px-3 py-1 bg-muted/50 rounded-lg">
                    <span className="text-xs text-muted-foreground font-medium">
                        {new Date().toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })}
                    </span>
                </div>

                <div className="flex flex-1 items-center justify-end space-x-2">
                    <InstallPWA className="hidden md:flex" />

                    {/* Theme Selector Popover */}
                    <Popover>
                        <PopoverTrigger asChild>
                            <AnimatedButton
                                variant="ghost"
                                size="icon"
                                className="h-9 w-9 rounded-xl border border-border bg-muted/50 hover:bg-muted"
                                title="Change Color Theme"
                            >
                                <Palette className="h-4 w-4" />
                                <span className="sr-only">Change Theme</span>
                            </AnimatedButton>
                        </PopoverTrigger>
                        <PopoverContent className="w-80" align="end">
                            <ThemeSelector />
                        </PopoverContent>
                    </Popover>

                    <ThemeToggle />

                    {user && (
                        <InitialsAvatar
                            username={user?.user_metadata?.display_name || user?.email?.split('@')[0] || 'U'}
                            avatarUrl={avatarUrl}
                            size="md"
                            isAdmin={role === 'admin'}
                            className="ml-2"
                        />
                    )}

                    <DropdownMenu open={isOpen} onOpenChange={setIsOpen} modal={false}>
                        <DropdownMenuTrigger asChild>
                            <AnimatedButton
                                variant="ghost"
                                size="icon"
                                className="md:ml-2 h-9 w-9 rounded-xl border border-border bg-muted/50 hover:bg-muted relative z-50"
                            >
                                {isOpen ? (
                                    <X className="h-4 w-4" />
                                ) : (
                                    <LayoutGrid className="h-4 w-4" />
                                )}
                                <span className="sr-only">Toggle menu</span>
                            </AnimatedButton>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent
                            align="end"
                            sideOffset={18}
                            alignOffset={-10}
                            className="w-14 min-w-0 flex flex-col items-center bg-background/95 backdrop-blur-md border rounded-[2rem] p-2 gap-1.5 shadow-xl animate-in fade-in-0 zoom-in-95 duration-200"
                        >
                            {/* Navigation Items - Only show when NOT on home page */}
                            {pathname !== "/" && navItems.map((item, index) => (
                                <DropdownMenuItem
                                    key={item.href}
                                    asChild
                                    className="p-0 focus:bg-transparent justify-center animate-in fade-in-0 slide-in-from-right-2"
                                    style={{ animationDelay: `${index * 50}ms`, animationFillMode: 'both' }}
                                >
                                    <Link
                                        href={item.href}
                                        className={cn(
                                            "flex items-center justify-center h-9 w-9 rounded-xl border transition-all duration-200",
                                            pathname === item.href
                                                ? "bg-primary text-primary-foreground border-primary shadow-sm"
                                                : "border-border bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground hover:scale-105"
                                        )}
                                        title={item.label}
                                    >
                                        <item.icon className="h-4 w-4" />
                                        <span className="sr-only">{item.label}</span>
                                    </Link>
                                </DropdownMenuItem>
                            ))}

                            {/* Admin Dashboard */}
                            {role === 'admin' && (
                                <DropdownMenuItem
                                    asChild
                                    className="p-0 focus:bg-transparent justify-center animate-in fade-in-0 slide-in-from-right-2"
                                    style={{ animationDelay: `${pathname === "/" ? 0 : navItems.length * 50}ms`, animationFillMode: 'both' }}
                                >
                                    <Link
                                        href="/admin"
                                        className={cn(
                                            "flex items-center justify-center h-9 w-9 rounded-xl border transition-all duration-200",
                                            pathname === "/admin"
                                                ? "bg-primary text-primary-foreground border-primary shadow-sm"
                                                : "border-border bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground hover:scale-105"
                                        )}
                                        title="Admin Dashboard"
                                    >
                                        <ShieldCheck className="h-4 w-4" />
                                        <span className="sr-only">Admin</span>
                                    </Link>
                                </DropdownMenuItem>
                            )}

                            {/* About Item - Only show when NOT on home page */}
                            {pathname !== "/" && (
                                <DropdownMenuItem
                                    asChild
                                    className="p-0 focus:bg-transparent justify-center animate-in fade-in-0 slide-in-from-right-2"
                                    style={{ animationDelay: `${(navItems.length + (role === 'admin' ? 1 : 0)) * 50}ms`, animationFillMode: 'both' }}
                                >
                                    <Link
                                        href="/about"
                                        className={cn(
                                            "flex items-center justify-center h-9 w-9 rounded-xl border transition-all duration-200",
                                            pathname === "/about"
                                                ? "bg-primary text-primary-foreground border-primary shadow-sm"
                                                : "border-border bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground hover:scale-105"
                                        )}
                                        title="About"
                                    >
                                        <Info className="h-4 w-4" />
                                        <span className="sr-only">About</span>
                                    </Link>
                                </DropdownMenuItem>
                            )}

                            {/* Logout Item - Always show */}
                            <DropdownMenuItem
                                className={cn(
                                    "p-0 focus:bg-transparent justify-center animate-in fade-in-0 slide-in-from-right-2",
                                    pathname !== "/" && "mt-1"
                                )}
                                style={{ animationDelay: `${pathname === "/" ? (role === 'admin' ? 50 : 0) : (navItems.length + (role === 'admin' ? 2 : 1)) * 50}ms`, animationFillMode: 'both' }}
                                onSelect={(e) => {
                                    e.preventDefault();
                                    handleLogout();
                                }}
                                disabled={isLoggingOut}
                            >
                                <div className={cn(
                                    "flex items-center justify-center h-9 w-9 rounded-xl border border-border bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground hover:scale-105 transition-all duration-200 cursor-pointer",
                                    isLoggingOut && "opacity-50 cursor-not-allowed"
                                )}
                                    title="Log out"
                                >
                                    {isLoggingOut ? (
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                    ) : (
                                        <LogOut className="h-4 w-4" />
                                    )}
                                </div>
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </div>
        </header>
    );
}

