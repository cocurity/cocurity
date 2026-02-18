import { auth } from "@/auth";
import { redirect } from "next/navigation";
import MyPageClient from "./MyPageClient";

export default async function MyPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  return <MyPageClient user={session.user} />;
}
