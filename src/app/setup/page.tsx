import prisma from "@/lib/db/prisma";
import bcrypt from "bcryptjs";
import { redirect } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";

export default async function SetupPage() {
  // Check if a super admin already exists
  const existingAdmin = await prisma.user.findFirst({
    where: { role: 'SUPER_ADMIN' }
  });

  // If setup is already done, lock this page down
  if (existingAdmin) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-zinc-950 text-white">
        <Card className="w-full max-w-md bg-zinc-900 border-zinc-800">
          <CardHeader>
            <CardTitle className="text-xl text-red-500">Access Denied</CardTitle>
            <CardDescription className="text-zinc-400">
              Setup has already been completed. This page is now securely locked.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  async function createAdmin(formData: FormData) {
    'use server';
    
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;
    const name = formData.get('name') as string;

    if (!email || !password || !name) {
      throw new Error('Missing fields');
    }

    // Double check inside the action to prevent race conditions
    const checkAdmin = await prisma.user.findFirst({
      where: { role: 'SUPER_ADMIN' }
    });

    if (checkAdmin) {
      throw new Error('Setup already completed');
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: {
        email,
        name,
        hashedPassword,
        role: 'SUPER_ADMIN',
      },
    });

    let branch = await prisma.branch.findFirst({ where: { code: 'MAIN' } });
    if (!branch) {
      branch = await prisma.branch.create({
        data: {
          name: 'Main Branch',
          code: 'MAIN',
          timezone: 'Asia/Kolkata',
        }
      });
    }

    await prisma.staffProfile.create({
      data: {
        userId: user.id,
        branchId: branch.id,
        employeeId: 'ADM001',
        firstName: name.split(' ')[0] || 'Admin',
        lastName: name.split(' ').slice(1).join(' ') || '',
        department: 'MANAGEMENT',
      },
    });

    // Redirect to login after successful setup
    redirect('/auth/login');
  }

  return (
    <div className="flex h-screen w-full items-center justify-center bg-zinc-950 text-white p-4">
      <Card className="w-full max-w-md bg-zinc-900 border-zinc-800">
        <CardHeader>
          <CardTitle className="text-2xl font-bold">Welcome to Pro Fitness OS</CardTitle>
          <CardDescription className="text-zinc-400">
            Create your owner account. This page will be permanently disabled after you click submit.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form action={createAdmin} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Full Name</Label>
              <Input id="name" name="name" required placeholder="John Doe" className="bg-zinc-950 border-zinc-800" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email Address</Label>
              <Input id="email" name="email" type="email" required placeholder="admin@profitness.com" className="bg-zinc-950 border-zinc-800" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Secure Password</Label>
              <Input id="password" name="password" type="password" required className="bg-zinc-950 border-zinc-800" />
            </div>
            <Button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold">
              Create Admin Account
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
