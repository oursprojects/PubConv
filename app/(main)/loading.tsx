export default function Loading() {
    return (
        <div className="flex h-full items-center justify-center bg-background">
            <div className="flex flex-col items-center gap-6 animate-in fade-in-0 zoom-in-95 duration-500">
                {/* Logo with pulse */}
                <div className="relative">
                    <div className="absolute inset-0 bg-primary/20 rounded-full blur-xl animate-pulse"></div>
                    <img
                        src="/logo.png"
                        alt="PubConv"
                        className="h-14 w-14 relative z-10 animate-pulse"
                    />
                </div>

                {/* Smooth loading dots */}
                <div className="flex items-center gap-2">
                    <div className="h-2 w-2 bg-primary rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                    <div className="h-2 w-2 bg-primary rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                    <div className="h-2 w-2 bg-primary rounded-full animate-bounce"></div>
                </div>
            </div>
        </div>
    );
}

