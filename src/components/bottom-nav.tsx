"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { LayoutDashboard, Target, ListChecks, UserRound } from "lucide-react";

export default function BottomNav() {
  const pathname = usePathname();

  const items = [
    { href: "/dashboard", icon: LayoutDashboard },
    { href: "/goals", icon: Target },
    { href: "/tasks", icon: ListChecks },
    { href: "/profile", icon: UserRound },
  ];

  return (
    <nav className="fixed inset-x-0 bottom-0 z-50">
      <ul className="mx-auto mb-5 flex w-[90%] max-w-sm rounded-2xl border border-white/20 bg-white/10 shadow-lg backdrop-blur-2xl">
        {items.map(({ href, icon: Icon }) => {
          const isActive = pathname === href;

          return (
            <li key={href} className="flex-1">
              <Link
                href={href}
                aria-current={isActive ? "page" : undefined}
                className="flex justify-center py-2"
              >
                <span
                  className={`flex size-11 items-center justify-center rounded-xl transition-all duration-300 ${
                    isActive
                      ? "bg-accent text-white shadow-md"
                      : "text-muted-foreground hover:bg-white/10"
                  }`}
                >
                  <Icon size={23} strokeWidth={1.8} />
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
