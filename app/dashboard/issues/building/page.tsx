"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";
import IssueList from "../issue-list";
import { setHeaderAction } from "@/components/dashboard/page-header-context";

export default function BuildingIssuesPage() {
  const router = useRouter();

  useEffect(() => {
    // Set the header action when component mounts
    setHeaderAction(() => {
      router.push("/dashboard/issues/new");
    });

    // Clean up when component unmounts
    return () => setHeaderAction(null);
  }, [router]);

  return <IssueList scope="building" />;
}