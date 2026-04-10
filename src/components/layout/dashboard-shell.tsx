"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BriefcaseBusiness, Bot, FileSearch, Sparkles } from "lucide-react";
import { UserButton } from "@clerk/nextjs";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/ats-analyzer", label: "ATS Analyzer", icon: FileSearch },
  { href: "/interview-coach", label: "AI Interview Coach", icon: Bot },
  { href: "/job-tracker", label: "Job Tracker", icon: BriefcaseBusiness },
];

export function DashboardShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="min-h-screen px-4 py-6 md:px-8">
      <div className="mx-auto grid max-w-7xl gap-5 lg:grid-cols-[250px_1fr]">
        <aside className="rounded-2xl border border-border/80 bg-card/60 p-4 backdrop-blur-xl">
          <div className="mb-6 flex items-center gap-2 px-2">
            <Sparkles className="h-5 w-5 text-accent" />
            <p className="text-sm font-semibold tracking-wide">IntelliHire</p>
          </div>

          <nav className="space-y-2">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition",
                    isActive
                      ? "bg-primary/20 text-foreground"
                      : "text-muted-foreground hover:bg-secondary/70 hover:text-foreground"
                  )}
                >
                  <Icon className="h-4 w-4" />
                  {item.label}
                </Link>
              );
            })}
          </nav>
          <div className="mt-6 border-t border-border/70 pt-4">
            <UserButton afterSignOutUrl="/sign-in" />
          </div>
        </aside>

        <main className="rounded-2xl border border-border/80 bg-card/40 p-5 backdrop-blur-xl md:p-7">
          {children}
        </main>
      </div>
    </div>
  );
}
