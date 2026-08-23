"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function TestRedirect() {
  const router = useRouter();
  useEffect(() => { router.replace("/tests"); }, [router]);
  return null;
}