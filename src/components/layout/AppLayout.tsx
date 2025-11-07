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
    <div className="flex min-h-screen w-full flex-col bg-muted/40">
      <AppSidebar className="hidden sm:flex" />
      <div className="flex flex-col sm:gap-4 sm:py-4 sm:pl-64">
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
        <main className="flex-1 overflow-y-auto p-4 sm:p-0">
          <Outlet />
        </main>
      </div>
      <Toaster richColors closeButton />
    </div>
  );
}