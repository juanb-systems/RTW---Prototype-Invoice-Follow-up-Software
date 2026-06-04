"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
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
  const pathname        = usePathname();
  const isActive        = pathname === href || (href !== "/dashboard" && pathname.startsWith(href));
  const { isDirty, dirtySource } = useNavGuardStore();
  const closeMobileMenu = useMobileMenuStore((s) => s.close);

  function handleClick(e: React.MouseEvent<HTMLAnchorElement>) {
    if (isActive) {
      e.preventDefault();
      closeMobileMenu();
      return;
    }
    if (isDirty) {
      const msg =
        dirtySource === "flow-builder"
          ? "You have unsaved changes in the flow builder. Leave without saving?"
          : "You have unsaved changes. Leave without saving?";
      if (!window.confirm(msg)) {
        e.preventDefault();
        return;
      }
    }
    closeMobileMenu();
  }

  return (
    <Link
      href={href}
      onClick={handleClick}
      className={cn(
        // M3 Navigation Drawer item — rounded-2xl pill, generous touch target
        "flex w-full items-center gap-3 px-3 py-2.5 rounded-2xl text-sm font-medium transition-all duration-150 group",
        isActive
          // Active: M3 secondary container on dark surface (translucent white)
          ? "bg-white/[0.12] text-white"
          // Inactive: no background, subtle hover
          : "text-zinc-400 hover:bg-white/[0.07] hover:text-zinc-100"
      )}
    >
      <Icon
        className={cn(
          "h-[18px] w-[18px] flex-shrink-0 transition-colors",
          isActive
            ? "text-blue-300"   // M3 primary accent on active item
            : "text-zinc-500 group-hover:text-zinc-300"
        )}
      />
      <span className="flex-1 text-left">{label}</span>
      {badge !== undefined && badge > 0 && (
        <span className="ml-auto flex h-5 min-w-5 items-center justify-center rounded-full bg-blue-500 px-1.5 text-xs font-semibold text-white">
          {badge}
        </span>
      )}
    </Link>
  );
}
