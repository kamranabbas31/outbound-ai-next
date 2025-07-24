"use client";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

// Redirect to Dashboard automatically
const Index = () => {
  const router = useRouter();

  useEffect(() => {
    router.push("/");
  }, [router]);

  return null;
};

export default Index;
