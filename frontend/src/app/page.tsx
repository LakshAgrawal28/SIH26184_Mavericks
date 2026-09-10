"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { getToken } from "@/lib/api";
import { Skeleton } from "@/components/Skeleton";

export default function HomePage() {
  const router = useRouter();
  useEffect(() => {
    router.replace(getToken() ? "/dashboard" : "/login");
  }, [router]);
  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50">
      <Skeleton className="h-8 w-32" />
    </div>
  );
}
