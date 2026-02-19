"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MapPin, Code, Sparkles, Heart, Crown, Users } from "lucide-react";
import Image from "next/image";

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
        <div className="flex h-full items-center justify-center p-4 overflow-hidden w-full">
            <div className="max-w-sm w-full space-y-5 animate-in slide-in-from-bottom-6 fade-in duration-500">

                {/* Profile Header */}
                <div className="text-center space-y-3">
                    {/* Avatar */}
                    <div className="relative mx-auto w-24 h-24 animate-in zoom-in-50 fade-in-0 duration-700" style={{ animationFillMode: 'both' }}>
                        <div className="absolute -inset-1 bg-gradient-to-br from-primary/30 to-primary/10 rounded-2xl blur-md"></div>
                        <div className="relative h-24 w-24 rounded-2xl overflow-hidden ring-2 ring-primary/50 ring-offset-2 ring-offset-background">
                            <Image
                                src="/mike_ryno.png"
                                alt="Group 1"
                                fill
                                className="object-cover hover:scale-110 transition-transform duration-300"
                                priority
                            />
                        </div>
                    </div>

                    {/* Name & Badge */}
                    <div className="animate-in fade-in-0 slide-in-from-bottom-3 duration-700" style={{ animationDelay: '150ms', animationFillMode: 'both' }}>
                        <Badge variant="outline" className="mb-2 px-2.5 py-0.5 text-[10px] uppercase tracking-widest border-primary/30">
                            <Sparkles className="h-3 w-3 mr-1" />
                            Developer
                        </Badge>
                        <h1 className="text-xl font-bold tracking-tight">Group 1</h1>
                        <p className="text-xs text-muted-foreground flex items-center justify-center gap-1 mt-1">
                            <MapPin className="h-3 w-3" />
                            Philippines
                        </p>
                    </div>
                </div>

                {/* Bio Card */}
                <Card className="bg-muted/30 border-border/50 animate-in fade-in-0 slide-in-from-bottom-4 duration-700" style={{ animationDelay: '300ms', animationFillMode: 'both' }}>
                    <CardContent className="p-4 text-center space-y-3">
                        <p className="text-sm text-muted-foreground leading-relaxed">
                            <span className="font-semibold text-foreground">PubConv</span> was created by <span className="font-semibold text-foreground">Group 1</span> — built from scratch to showcase our passion for creating real-time, interactive applications.
                        </p>
                        <div className="flex items-center justify-center gap-1.5 text-xs text-primary/80 italic pt-1">
                            <Heart className="h-3.5 w-3.5" />
                            &quot;Let AI empower you to build what you never could alone.&quot;
                        </div>
                    </CardContent>
                </Card>

                {/* Members Card */}
                <Card className="bg-muted/30 border-border/50 animate-in fade-in-0 slide-in-from-bottom-4 duration-700" style={{ animationDelay: '400ms', animationFillMode: 'both' }}>
                    <CardContent className="p-4 space-y-2">
                        {/* Leader */}
                        <div className="flex items-center gap-2 pb-2 border-b border-border/50">
                            <Crown className="h-3.5 w-3.5 text-yellow-500 shrink-0" />
                            <div>
                                <p className="text-[10px] text-muted-foreground uppercase tracking-widest">Leader</p>
                                <p className="text-sm font-semibold text-foreground">Mike Ryno Santiago</p>
                            </div>
                        </div>
                        {/* Members */}
                        <div className="flex items-start gap-2 pt-1">
                            <Users className="h-3.5 w-3.5 text-primary shrink-0 mt-0.5" />
                            <div className="space-y-0.5">
                                <p className="text-[10px] text-muted-foreground uppercase tracking-widest mb-1">Members</p>
                                {members.map((name) => (
                                    <p key={name} className="text-xs text-foreground/80">{name}</p>
                                ))}
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Tech Stack */}
                <div className="animate-in fade-in-0 slide-in-from-bottom-4 duration-700" style={{ animationDelay: '550ms', animationFillMode: 'both' }}>
                    <div className="flex items-center justify-center gap-1.5 mb-2">
                        <Code className="h-3 w-3 text-muted-foreground" />
                        <span className="text-[10px] text-muted-foreground uppercase tracking-wide">Built with</span>
                    </div>
                    <div className="flex flex-wrap justify-center gap-1.5">
                        {techStack.map((tech, i) => (
                            <Badge
                                key={tech.name}
                                className={`${tech.color} text-[10px] px-2 py-0.5 font-medium border-0 animate-in fade-in-0 zoom-in-75 duration-500`}
                                style={{ animationDelay: `${650 + i * 80}ms`, animationFillMode: 'both' }}
                            >
                                {tech.name}
                            </Badge>
                        ))}
                    </div>
                </div>

            </div>
        </div>
    );
}
