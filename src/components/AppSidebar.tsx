"use client";

import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import { LayoutDashboard, Phone, FileText, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export function AppSidebar() {
  const pathname = usePathname();
  const router = useRouter();

  const menuItems = [
    {
      name: "Dashboard",
      path: "/dashboard",
      icon: <LayoutDashboard className="h-5 w-5" />,
    },
    {
      name: "Campaigns",
      path: "/campaigns",
      icon: <Phone className="h-5 w-5" />,
    },
    {
      name: "Billing",
      path: "/billing",
      icon: <FileText className="h-5 w-5" />,
    },
  ];

  const handleLogout = () => {
    toast.success("Logged out successfully");
    router.replace("/login");
  };

  return (
    <div className="hidden md:flex flex-col h-screen w-56 border-r bg-white">
      <div className="flex items-center h-16 px-4 border-b">
        <img
          src="/lovable-uploads/620a3236-a743-4779-8cde-07f0a587c6ed.png"
          alt="Logo"
          className="h-8"
        />
        <h1 className="ml-2 text-sm font-semibold">Conversion Media Group</h1>
      </div>
      <nav className="flex flex-col flex-1 p-4 space-y-1">
        {menuItems.map((item) => (
          <Link
            key={item.path}
            href={item.path}
            className={`flex items-center h-10 px-4 rounded-md ${
              pathname === item.path
                ? "bg-muted text-primary font-medium"
                : "text-muted-foreground hover:bg-muted"
            }`}
          >
            <span className="mr-3">{item.icon}</span>
            {item.name}
          </Link>
        ))}
      </nav>
      <div className="mt-auto p-4 border-t">
        <Button
          variant="ghost"
          className="w-full justify-start text-muted-foreground hover:bg-muted"
          onClick={handleLogout}
        >
          <LogOut className="h-5 w-5 mr-3" /> Logout
        </Button>
      </div>
    </div>
  );
}
