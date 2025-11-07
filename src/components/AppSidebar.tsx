import React from "react";
import { NavLink } from "react-router-dom";
import {
  LayoutDashboard,
  ShoppingCart,
  Package,
  FileText,
  BarChart2,
  Settings,
  Crown,
} from "lucide-react";
import { cn } from "@/lib/utils";
const navItems = [
  { to: "/", icon: LayoutDashboard, label: "Dashboard" },
  { to: "/billing", icon: ShoppingCart, label: "Billing" },
  { to: "/inventory", icon: Package, label: "Inventory" },
  { to: "/invoices", icon: FileText, label: "Invoices" },
  { to: "/reports", icon: BarChart2, label: "Reports" },
  { to: "/settings", icon: Settings, label: "Settings" },
];
export function AppSidebar({
  onLinkClick,
  className,
}: {
  onLinkClick?: () => void;
  className?: string;
}): JSX.Element {
  return (
    <aside
      className={cn(
        "fixed inset-y-0 left-0 z-10 hidden w-64 flex-col border-r bg-background sm:flex",
        className
      )}
    >
      <div className="flex h-full max-h-screen flex-col gap-2">
        <div className="flex h-14 items-center border-b px-4 lg:h-[60px] lg:px-6">
          <NavLink to="/" className="flex items-center gap-2 font-semibold" onClick={onLinkClick}>
            <Crown className="h-6 w-6 text-amber-500" />
            <span className="">CROWN</span>
          </NavLink>
        </div>
        <div className="flex-1 overflow-y-auto">
          <nav className="grid items-start px-2 text-sm font-medium lg:px-4">
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                onClick={onLinkClick}
                className={({ isActive }) =>
                  cn(
                    "flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary",
                    isActive && "bg-muted text-primary"
                  )
                }
              >
                <item.icon className="h-4 w-4" />
                {item.label}
              </NavLink>
            ))}
          </nav>
        </div>
        <div className="mt-auto p-4">
          <div className="text-xs text-muted-foreground text-center">
            Built with ��️ at Cloudflare
          </div>
        </div>
      </div>
    </aside>
  );
}