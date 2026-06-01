"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { Sidebar } from "./Sidebar";
import { useMobileMenuStore } from "@/lib/mobile-menu-store";

export function AppShell({ children }: { children: React.ReactNode }) {
  const { isOpen, close } = useMobileMenuStore();
  const pathname = usePathname();

  useEffect(() => {
    close();
  }, [pathname, close]);

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50">
      {/* Desktop sidebar — always visible md+, z-20 keeps it above page content overlays */}
      <div className="hidden md:flex md:flex-shrink-0 z-20">
        <Sidebar />
      </div>

      {/* Mobile sidebar drawer */}
      {isOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div
            className="absolute inset-0 bg-black/60"
            onClick={close}
            aria-hidden="true"
          />
          <div className="absolute left-0 top-0 h-full w-64 shadow-2xl z-10">
            <Sidebar />
          </div>
        </div>
      )}

      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        <main className="flex-1 overflow-y-auto">{children}</main>
      </div>
    </div>
  );
}
