"use client";

import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useSelector } from "react-redux";

export default function HomeRedirector() {
  const router = useRouter();
  const pathname = usePathname();
  const user = useSelector((state: any) => state.auth.user);

  useEffect(() => {
    console.log({ pathname, router });
    if (pathname === "/") {
      if (user) {
        router.replace("/dashboard");
      } else {
        router.replace("/login");
      }
    }
  }, [user, router]);

  return null;
}
