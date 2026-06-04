import { redirect } from "next/navigation";
import { getCurrentUser, getRoleHomePath } from "@/lib/auth";

export default async function HomePage() {
  const user = await getCurrentUser();
  if (user) redirect(getRoleHomePath(user.role));
  redirect("/login");
}
