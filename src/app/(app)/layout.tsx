import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { AppShell } from "@/components/layout/AppShell";
import { ROLE_LABELS } from "@/lib/labels";
import { processOverdueTasks } from "@/lib/automations";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  await processOverdueTasks().catch(() => 0);

  const notifications = await prisma.notification.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "desc" },
    take: 15,
  });

  return (
    <AppShell
      role={session.user.role}
      user={{
        name: session.user.name,
        email: session.user.email,
        role: ROLE_LABELS[session.user.role] || session.user.role,
      }}
      notifications={notifications}
    >
      {children}
    </AppShell>
  );
}
