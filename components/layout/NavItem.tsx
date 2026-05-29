"use client";

import { usePathname, useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";
import { useNavGuardStore } from "@/lib/nav-guard-store";
import { useMobileMenuStore } from "@/lib/mobile-menu-store";

interface NavItemProps {
  href: string;
  icon: LucideIcon;
  label: string;
  badge?: number;
}

export function NavItem({ href, icon: Icon, label, badge }: NavItemProps) {
  const pathname = usePathname();
  const router = useRouter();
  const isActive = pathname === href || (href !== "/dashboard" && pathname.startsWith(href));
  const { isDirty, dirtySource } = useNavGuardStore();
  const closeMobileMenu = useMobileMenuStore((s) => s.close);

  function handleClick() {
    if (isActive) { closeMobileMenu(); return; }
    if (isDirty) {
      const msg =
        dirtySource === "flow-builder"
          ? "You have unsaved changes in the flow builder. Leave without saving?"
          : "You have unsaved changes. Leave without saving?";
      if (!window.confirm(msg)) return;
    }
    closeMobileMenu();
    router.push(href);
  }

  return (
    <button
      onClick={handleClick}
      className={cn(
        "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors group",
        isActive
          ? "bg-zinc-800 text-white"
          : "text-zinc-400 hover:bg-zinc-800/60 hover:text-zinc-100"
      )}
    >
      <Icon
        className={cn(
          "h-4 w-4 flex-shrink-0",
          isActive ? "text-white" : "text-zinc-500 group-hover:text-zinc-300"
        )}
      />
      <span className="flex-1 text-left">{label}</span>
      {badge !== undefined && badge > 0 && (
        <span className="ml-auto flex h-5 min-w-5 items-center justify-center rounded-full bg-blue-500 px-1.5 text-xs font-semibold text-white">
          {badge}
        </span>
      )}
    </button>
  );
}
