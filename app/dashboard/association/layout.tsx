import { getCurrentUser } from "@/lib/auth";
import { redirect } from "next/navigation";

export default async function AssociationLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();
  
  if (!user) {
    redirect("/sign-in");
  }

  return <>{children}</>;
}