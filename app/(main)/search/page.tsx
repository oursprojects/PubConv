import { UserSearch } from "@/components/chat/UserSearch";
import { Users } from "lucide-react";

export default function SearchPage() {
    return (
        <div className="w-full max-w-2xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
            <div className="flex items-center gap-3 mb-6 animate-in fade-in-0 slide-in-from-bottom-4 duration-500">
                <div className="p-2 rounded-xl bg-primary/10">
                    <Users className="h-5 w-5 text-primary" />
                </div>
                <h1 className="text-2xl font-bold">Discover</h1>
            </div>
            <div className="animate-in fade-in-0 slide-in-from-bottom-4 duration-500" style={{ animationDelay: '100ms', animationFillMode: 'both' }}>
                <UserSearch />
            </div>
        </div>
    );
}

