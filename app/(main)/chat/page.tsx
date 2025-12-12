import { ChatInterface } from "@/components/chat/ChatInterface";

export default function ChatPage() {
    return (
        <div className="flex flex-col h-full w-full max-w-3xl mx-auto p-4 overflow-hidden animate-in fade-in-0 duration-300">
            <ChatInterface />
        </div>
    );
}

