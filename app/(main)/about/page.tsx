"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
    MapPin,
    Code,
    Sparkles,
    Heart,
    Crown,
    Users,
    Shapes,
    MessageCircle,
} from "lucide-react";

const techStack = [
    { name: "Next.js", color: "bg-black text-white dark:bg-white dark:text-black" },
    { name: "React", color: "bg-blue-500/10 text-blue-600 dark:text-blue-400" },
    { name: "TypeScript", color: "bg-blue-600/10 text-blue-700 dark:text-blue-300" },
    { name: "Supabase", color: "bg-green-500/10 text-green-600 dark:text-green-400" },
    { name: "Tailwind", color: "bg-cyan-500/10 text-cyan-600 dark:text-cyan-400" },
];

const members = [
    "Hannah Joyce Lagat",
    "Mary Claire Valle",
    "Catherine Corpuz",
    "John Carlo Flores",
    "Karylle Jamie",
    "Rose-Ann Barangayan Borac",
    "Marswin Antonio",
];

export default function AboutPage() {
    return (
        <section className="relative w-full h-full overflow-hidden p-3 sm:p-5 md:p-6">
            <div className="pointer-events-none absolute inset-0">
                <div className="absolute -top-24 right-[-6rem] h-64 w-64 rounded-full bg-primary/10 blur-3xl" />
                <div className="absolute bottom-[-5rem] left-[-4rem] h-56 w-56 rounded-full bg-cyan-500/10 blur-3xl" />
            </div>

            <div className="relative mx-auto w-full max-w-5xl animate-in fade-in slide-in-from-bottom-3 duration-500">
                <Card className="border-border/70 bg-background/85 backdrop-blur-sm shadow-lg">
                    <CardContent className="p-4 sm:p-6 md:p-7">
                        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 md:gap-6">
                            <div className="space-y-4">
                                <div className="flex items-center gap-3">
                                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/15 text-primary ring-1 ring-primary/20">
                                        <Shapes className="h-6 w-6" />
                                    </div>
                                    <div>
                                        <Badge
                                            variant="outline"
                                            className="mb-1 border-primary/30 px-2.5 py-0.5 text-[10px] uppercase tracking-widest"
                                        >
                                            <Sparkles className="mr-1 h-3 w-3" />
                                            Group Project
                                        </Badge>
                                        <h1 className="text-xl font-bold tracking-tight sm:text-2xl">PubConv - Group 1</h1>
                                        <p className="mt-0.5 flex items-center gap-1 text-xs text-muted-foreground sm:text-sm">
                                            <MapPin className="h-3.5 w-3.5" />
                                            Philippines
                                        </p>
                                    </div>
                                </div>

                                <Card className="border-border/60 bg-muted/30">
                                    <CardContent className="space-y-3 p-4">
                                        <p className="text-sm leading-relaxed text-muted-foreground sm:text-[15px]">
                                            <span className="font-semibold text-foreground">PubConv</span> is built by{" "}
                                            <span className="font-semibold text-foreground">Group 1</span> as a real-time
                                            chat platform focused on clean UX, reliability, and mobile readiness.
                                        </p>
                                        <div className="flex items-center gap-2 text-xs italic text-primary/80 sm:text-sm">
                                            <Heart className="h-4 w-4" />
                                            "Built by a team, for real conversations."
                                        </div>
                                    </CardContent>
                                </Card>

                                <Card className="border-border/60 bg-muted/30">
                                    <CardContent className="space-y-2 p-4">
                                        <div className="mb-1 flex items-center gap-2">
                                            <Code className="h-4 w-4 text-muted-foreground" />
                                            <p className="text-[11px] uppercase tracking-wider text-muted-foreground">Tech Stack</p>
                                        </div>
                                        <div className="flex flex-wrap gap-1.5 sm:gap-2">
                                            {techStack.map((tech, i) => (
                                                <Badge
                                                    key={tech.name}
                                                    className={`${tech.color} border-0 px-2 py-0.5 text-[10px] font-medium sm:text-xs animate-in fade-in zoom-in-75 duration-500`}
                                                    style={{ animationDelay: `${250 + i * 70}ms`, animationFillMode: "both" }}
                                                >
                                                    {tech.name}
                                                </Badge>
                                            ))}
                                        </div>
                                    </CardContent>
                                </Card>
                            </div>

                            <div className="space-y-4">
                                <Card className="border-border/60 bg-muted/30">
                                    <CardContent className="space-y-3 p-4">
                                        <div className="flex items-center gap-2 border-b border-border/50 pb-2">
                                            <Crown className="h-4 w-4 shrink-0 text-yellow-500" />
                                            <div>
                                                <p className="text-[10px] uppercase tracking-widest text-muted-foreground">Leader</p>
                                                <p className="text-sm font-semibold text-foreground sm:text-base">Mike Ryno Santiago</p>
                                            </div>
                                        </div>

                                        <div className="flex items-start gap-2">
                                            <Users className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                                            <div className="space-y-1">
                                                <p className="mb-1 text-[10px] uppercase tracking-widest text-muted-foreground">Members</p>
                                                {members.map((name) => (
                                                    <p key={name} className="text-xs text-foreground/85 sm:text-sm">
                                                        {name}
                                                    </p>
                                                ))}
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>

                                <Card className="border-border/60 bg-muted/30">
                                    <CardContent className="p-4">
                                        <div className="flex items-start gap-2">
                                            <MessageCircle className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                                            <div>
                                                <p className="text-sm font-medium text-foreground">Team Note</p>
                                                <p className="mt-1 text-xs leading-relaxed text-muted-foreground sm:text-sm">
                                                    This page is intentionally group-first. Individual profile photos are excluded so the
                                                    project identity stays centered on the whole team.
                                                </p>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </section>
    );
}
