import { Sidebar } from "@/components/layout/sidebar";
import { Topbar } from "@/components/layout/topbar";
import { auth } from "@/lib/auth/auth";
import prisma from "@/lib/db/prisma";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  let branchName = "HQ Branch";
  
  if (session?.user?.id) {
    const staff = await prisma.staffProfile.findUnique({
      where: { userId: session.user.id },
      include: { branch: true }
    });
    if (staff?.branch) {
      branchName = staff.branch.name;
    }
  }

  return (
    <div className="h-full relative bg-background text-foreground">
      <div className="hidden h-full md:flex md:w-72 md:flex-col md:fixed md:inset-y-0 z-80">
        <Sidebar branchName={branchName} />
      </div>
      <main className="md:pl-72 flex flex-col h-full">
        <div className="h-16 flex-none">
          <Topbar branchName={branchName} session={session} />
        </div>
        <div className="flex-1 overflow-auto bg-background">
          {children}
        </div>
      </main>
    </div>
  );
}
