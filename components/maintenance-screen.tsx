import { Wrench } from "lucide-react";

export function MaintenanceScreen() {
    return (
        <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-background p-4 text-center animate-in fade-in duration-300">
            <div className="rounded-full bg-muted p-6 mb-6">
                <Wrench className="h-12 w-12 text-primary animate-pulse" />
            </div>
            <h1 className="text-4xl font-bold tracking-tight mb-2">System Maintenance</h1>
            <p className="text-muted-foreground text-lg max-w-md mx-auto">
                We are currently performing scheduled maintenance to improve your experience.
                Please check back soon.
            </p>
            <div className="mt-8 text-sm text-muted-foreground">
                <p>Expected duration: 30 minutes</p>
            </div>
        </div>
    );
}
