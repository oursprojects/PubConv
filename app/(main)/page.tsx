"use client";

import * as React from "react";
import Link from "next/link";
import { Globe, Search, UserCircle, Send, CalendarDays, Info } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Card, CardContent } from "@/components/ui/card";

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
  return "Good day";
}

export default function DashboardPage() {
  const [user, setUser] = React.useState<any>(null);
  const [loading, setLoading] = React.useState(true);
  const supabase = createClient();

  React.useEffect(() => {
    async function loadUser() {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        setUser(user);
      } catch (error) {
        console.error("Error loading user:", error);
      } finally {
        setLoading(false);
      }
    }
    loadUser();
  }, [supabase]);

  const displayName = user?.user_metadata?.display_name || user?.email?.split("@")[0] || "";

  if (loading) {
    return (
      <div className="h-full w-full flex items-center justify-center p-8 bg-background">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="h-full w-full overflow-hidden flex flex-col bg-background">
      <div className="flex flex-col flex-1 px-6 py-8 md:p-12 max-w-2xl mx-auto w-full overflow-y-auto">
        {/* Greeting - Centered */}
        <div className="text-center mb-8 md:mb-12 animate-in fade-in-0 slide-in-from-bottom-4 duration-500">
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight mb-2">
            {getGreeting()}{displayName ? `, ${displayName}` : ""}!
          </h1>
          <p className="text-base text-muted-foreground max-w-sm mx-auto">
            Welcome.
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
            Developed by <span className="font-semibold text-primary">Group 1</span>
          </p>
          <Link href="/terms" className="text-xs text-muted-foreground hover:text-primary mt-1 inline-block">
            Terms & Conditions
          </Link>
        </div>
      </div>
    </div>
  );
}


