"use client";

import Link from "next/link";
import { Sparkles, Globe, Search, UserCircle, Send, CalendarDays, Info } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { useEffect, useState } from "react";

const features = [
  {
    href: "/chat",
    icon: Globe,
    title: "Global Chat",
    description: "Connect with everyone in one space.",
  },
  {
    href: "/calendar",
    icon: CalendarDays,
    title: "Calendar",
    description: "View dates and plan your schedule.",
  },
  {
    href: "/search",
    icon: Search,
    title: "Discover",
    description: "Find user profiles effortlessly.",
  },
  {
    href: "/profile",
    icon: UserCircle,
    title: "Profile",
    description: "View and manage your account details.",
  },
  {
    href: "/feedback",
    icon: Send,
    title: "Feedback",
    description: "Write us a feedback or report a bug.",
  },
  {
    href: "/about",
    icon: Info,
    title: "About",
    description: "Learn more about PubConv.",
  },
];

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
}

export default function DashboardPage() {
  const [displayName, setDisplayName] = useState("User");
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    async function loadUser() {
      const { data: { session } } = await supabase.auth.getSession();
      const user = session?.user;
      const display = user?.user_metadata?.display_name || user?.email?.split("@")[0] || "User";
      setDisplayName(display);
      setLoading(false);
    }
    loadUser();
  }, [supabase]);

  // We can render the UI even with default "User" while loading, maybe?
  // Or just show skeleton? 
  // Given the layout, showing "Good day, User!" and then updating is fine.

  return (
    <div className="h-full w-full overflow-hidden flex flex-col">
      <div className="flex flex-col flex-1 px-6 py-6 md:p-8 max-w-md mx-auto w-full">
        {/* Greeting - Centered */}
        <div className="text-center mb-6 md:mb-8 animate-in fade-in-0 slide-in-from-bottom-4 duration-500">
          <h1 className="text-2xl md:text-3xl font-bold mb-1">
            {getGreeting()}, {displayName}!
          </h1>
          <p className="text-sm text-muted-foreground">
            Welcome to PubConv! Glad you're here.
          </p>
        </div>

        {/* Feature Cards - 2x2 Grid */}
        <div className="grid grid-cols-2 gap-3 md:gap-4 mb-6">
          {features.map((feature, index) => (
            <Link
              key={feature.href}
              href={feature.href}
              className="animate-in fade-in-0 slide-in-from-bottom-4 duration-500"
              style={{ animationDelay: `${(index + 1) * 100}ms`, animationFillMode: 'both' }}
            >
              <Card className="h-full hover:bg-muted/60 hover:scale-[1.02] transition-all duration-200 cursor-pointer border border-border bg-muted/40 group rounded-xl">
                <CardContent className="p-3 md:p-4 flex items-start gap-2.5 md:gap-3">
                  <div className="p-2 md:p-2.5 rounded-lg md:rounded-xl bg-muted/80 group-hover:bg-primary/10 transition-colors duration-200 shrink-0">
                    <feature.icon className="h-5 w-5 md:h-6 md:w-6 text-foreground group-hover:text-primary transition-colors" />
                  </div>
                  <div className="min-w-0">
                    <h3 className="font-semibold text-sm md:text-base">{feature.title}</h3>
                    <p className="text-[11px] md:text-xs text-muted-foreground leading-tight md:leading-snug md:mt-0.5">
                      {feature.description}
                    </p>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>

        {/* Footer */}
        <div className="text-center mt-auto animate-in fade-in-0 duration-700" style={{ animationDelay: '500ms', animationFillMode: 'both' }}>
          <p className="text-xs text-muted-foreground">
            Developed by <span className="font-semibold text-primary">Mike Ryno Santiago</span>
          </p>
          <Link href="/terms" className="text-xs text-muted-foreground hover:text-primary mt-1 inline-block">
            Terms & Conditions
          </Link>
        </div>
      </div>
    </div>
  );
}


