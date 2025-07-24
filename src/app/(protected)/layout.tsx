"use client";

import { ReactNode, useEffect } from "react";
import { useSelector } from "react-redux";
import { useRouter } from "next/navigation";
import {
  SidebarProvider,
  SidebarInset,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { AppSidebar } from "./../../components/AppSidebar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { LogOut, User } from "lucide-react";
import { toast } from "sonner";

export default function ProtectedLayout({ children }: { children: ReactNode }) {
  const user = useSelector((s: any) => s.auth.user);
  const router = useRouter();

  useEffect(() => {
    if (!user) router.replace("/login");
  }, [user]);

  if (!user) return null;

  const handleLogout = () => {
    // replace with your actual logout logic
    toast.success("Logged out successfully");
    router.replace("/login");
  };

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-gray-50">
        <AppSidebar />

        <SidebarInset className="flex-1 flex-col">
          <header className="bg-white border-b h-16 flex items-center justify-between px-8 sticky top-0 z-40">
            <SidebarTrigger className="h-8 w-8" />
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="rounded-full focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2">
                  <Avatar className="h-10 w-10">
                    <AvatarImage
                      src="/lovable-uploads/620a3236-a743-4779-8cde-07f0a587c6ed.png"
                      alt="User"
                    />
                    <AvatarFallback>
                      <User className="h-6 w-6" />
                    </AvatarFallback>
                  </Avatar>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem className="text-sm">
                  conversionmediagroup
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={handleLogout}
                  className="text-sm cursor-pointer flex items-center text-red-500"
                >
                  <LogOut className="mr-2 h-4 w-4" /> Logout
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </header>

          <main className="py-6 px-8 overflow-auto">{children}</main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}
