"use client";

import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useSelector } from "react-redux";
import { RootState } from "@/store/store";

export default function HomeRedirector() {
  const router = useRouter();
  const pathname = usePathname();
  const user = useSelector((state: RootState) => state.auth.user);

  useEffect(() => {
    // Only run this effect on the client
    if (typeof window === "undefined") return;

    if (pathname === "/" && user !== undefined) {
      router.replace(user ? "/dashboard" : "/login");
    }
  }, [pathname, user, router]);

  return null;
}
