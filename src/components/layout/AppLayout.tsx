import React from "react";
import { Outlet } from "react-router-dom";
import { AppSidebar } from "@/components/AppSidebar";
import { Toaster } from "@/components/ui/sonner";
import { ThemeToggle } from "../ThemeToggle";

export function AppLayout(): JSX.Element {
  return (
    <div className="flex h-screen bg-background text-foreground">
      <AppSidebar />
      <main className="flex-1 overflow-y-auto">
        <ThemeToggle className="absolute top-4 right-4 z-50" />
        <Outlet />
      </main>
      <Toaster richColors closeButton />
    </div>
  );
}