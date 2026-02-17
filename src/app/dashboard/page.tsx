import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";

export default async function DashboardPage() {
  const session = await auth();

  if (!session) {
    redirect("/login");
  }

  // Redirect based on role
  if (session.user.role === "ADMIN") {
    redirect("/admin/dashboard");
  } else {
    redirect("/employee/dashboard");
  }
}
