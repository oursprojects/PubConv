"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent } from "@/components/ui/card";
import { SearchIcon, Users } from "lucide-react";
import { useDebounce } from "@/hooks/useDebounce";

// Check if avatar_url is a default DiceBear API URL (not a custom upload)
function isDefaultAvatar(url: string | null): boolean {
    if (!url) return true;
    return url.includes('api.dicebear.com') || url.includes('avataaars');
}

export function UserSearch() {
    const [query, setQuery] = useState("");
    const [results, setResults] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const debouncedQuery = useDebounce(query, 500);
    const supabase = createClient();

    useEffect(() => {
        async function searchUsers() {
            if (!debouncedQuery) {
                setResults([]);
                return;
            }

            setLoading(true);
            const { data, error } = await supabase
                .from("profiles")
                .select("username, avatar_url, bio")
                .ilike("username", `%${debouncedQuery}%`)
                .limit(20);

            setLoading(false);
            if (data) {
                setResults(data);
            }
        }

        searchUsers();
    }, [debouncedQuery, supabase]);

    return (
        <div className="space-y-6">
            {/* Search Input */}
            <div className="relative">
                <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                    placeholder="Search for users..."
                    className="pl-10 h-11 rounded-xl bg-muted/50 border-0 focus-visible:ring-2 focus-visible:ring-primary/20"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                />
            </div>

            {/* Results */}
            <div className="space-y-3">
                {loading && (
                    <div className="flex items-center justify-center py-8">
                        <div className="flex items-center gap-2 text-muted-foreground">
                            <div className="h-4 w-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                            <span className="text-sm">Searching...</span>
                        </div>
                    </div>
                )}

                {!loading && results.length === 0 && debouncedQuery && (
                    <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                        <Users className="h-12 w-12 mb-3 opacity-50" />
                        <p className="text-sm font-medium">No users found</p>
                        <p className="text-xs">Try a different search term</p>
                    </div>
                )}

                {!loading && !debouncedQuery && (
                    <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                        <SearchIcon className="h-12 w-12 mb-3 opacity-50" />
                        <p className="text-sm font-medium">Discover users</p>
                        <p className="text-xs">Start typing to search</p>
                    </div>
                )}

                {results.map((user) => (
                    <Card key={user.username} className="overflow-hidden hover:bg-muted/30 transition-colors">
                        <CardContent className="flex items-center gap-4 p-4">
                            <Avatar className="h-12 w-12 shrink-0">
                                {/* Only show image if it's a custom upload, not a default API avatar */}
                                {!isDefaultAvatar(user.avatar_url) && (
                                    <AvatarImage src={user.avatar_url} alt={user.username} />
                                )}
                                <AvatarFallback className="text-lg font-semibold bg-primary/10 text-primary">
                                    {user.username[0].toUpperCase()}
                                </AvatarFallback>
                            </Avatar>
                            <div className="min-w-0 flex-1">
                                <p className="font-semibold truncate">{user.username}</p>
                                <p className="text-sm text-muted-foreground line-clamp-1">
                                    {user.bio || "No bio yet"}
                                </p>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>
        </div>
    );
}

