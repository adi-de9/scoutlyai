import { ReactNode } from "react";
import { DesktopSidebar, MobileNav } from "@/components/nav/AppNav";

export function AppShell({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen">
      <DesktopSidebar />
      <div className="flex min-h-screen flex-1 flex-col">
        <main className="mx-auto w-full max-w-2xl flex-1 px-4 pb-32 pt-5 sm:px-5 lg:max-w-4xl lg:px-8 lg:pb-10 lg:pt-10">
          {children}
        </main>
        <MobileNav />
      </div>
    </div>
  );
}
