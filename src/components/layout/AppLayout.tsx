import React, { useState } from "react";
import { Outlet, NavLink } from "react-router-dom";
import { AppSidebar } from "@/components/AppSidebar";
import { Toaster } from "@/components/ui/sonner";
import { ThemeToggle } from "../ThemeToggle";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { PanelLeft, Crown } from "lucide-react";

export function AppLayout(): JSX.Element {
  const [isMobileMenuOpen, setMobileMenuOpen] = useState(false);
  return (
    <div className="min-h-screen w-full bg-muted/40">
      {/* render sidebar (it may be fixed internally) */}
      <AppSidebar className="hidden sm:flex" />

      {/* when sidebar is fixed, use left-margin; if sidebar is in-flow, ml-64 harmlessly shifts content */}
      <div className="flex flex-col sm:ml-64">
        <header className="sticky top-0 z-30 flex h-14 items-center gap-4 border-b bg-background px-4 sm:static sm:h-auto sm:border-0 sm:bg-transparent sm:px-6">
          <Sheet open={isMobileMenuOpen} onOpenChange={setMobileMenuOpen}>
            <SheetTrigger asChild>
              <Button size="icon" variant="outline" className="sm:hidden">
                <PanelLeft className="h-5 w-5" />
                <span className="sr-only">Toggle Menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="p-0">
              <AppSidebar
                className="flex h-full flex-col"
                onLinkClick={() => setMobileMenuOpen(false)}
              />
            </SheetContent>
          </Sheet>

          <div className="flex items-center gap-2 sm:hidden">
            <NavLink to="/" className="flex items-center gap-2 font-semibold">
              <Crown className="h-6 w-6 text-amber-500" />
              <span className="">CROWN</span>
            </NavLink>
          </div>

          <div className="ml-auto">
            <ThemeToggle className="static" />
          </div>
        </header>

        {/* Main: tightened padding + space-y; wrapper centers and limits width */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6">
          <div className="max-w-[1200px] w-full mx-auto space-y-4">
            <Outlet />
          </div>
        </main>
      </div>

      <Toaster richColors closeButton />
    </div>
  );
}
