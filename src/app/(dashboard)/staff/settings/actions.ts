'use server';

import { auth } from '@/lib/auth/auth';
import prisma from '@/lib/db/prisma';
import { revalidatePath } from 'next/cache';
import { updateBranchSchema, updateProfileSchema } from '@/lib/validations/settings.schema';

export async function updateBranchAction(branchId: string, formData: FormData) {
  const session = await auth();
  if (!session?.user?.id) throw new Error('Unauthorized');

  // Verify staff permissions for this branch
  const staff = await prisma.staffProfile.findUnique({
    where: { userId: session.user.id }
  });

  const user = await prisma.user.findUnique({
    where: { id: session.user.id }
  });

  if (user?.role !== 'SUPER_ADMIN' && (!staff || staff.branchId !== branchId)) {
    throw new Error('Unauthorized to modify this branch');
  }
  
  if (user?.role !== 'MANAGER' && user?.role !== 'ADMIN' && user?.role !== 'SUPER_ADMIN') {
    throw new Error('Insufficient permissions to modify branch settings');
  }

  const rawData = {
    name: formData.get('name'),
    code: formData.get('code'),
    address: formData.get('address'),
    phone: formData.get('phone'),
    timezone: formData.get('timezone')
  };

  const parsed = updateBranchSchema.parse(rawData);

  await prisma.branch.update({
    where: { id: branchId },
    data: {
      name: parsed.name,
      code: parsed.code,
      address: parsed.address || null,
      phone: parsed.phone || null,
      timezone: parsed.timezone
    }
  });

  revalidatePath('/staff/settings');
  return { success: true };
}

export async function updateProfileAction(formData: FormData) {
  const session = await auth();
  if (!session?.user?.id) throw new Error('Unauthorized');

  const rawData = {
    name: formData.get('name'),
    phone: formData.get('phone')
  };

  const parsed = updateProfileSchema.parse(rawData);

  await prisma.$transaction([
    prisma.user.update({
      where: { id: session.user.id },
      data: { name: parsed.name }
    }),
    prisma.staffProfile.update({
      where: { userId: session.user.id },
      data: { phone: parsed.phone || null }
    })
  ]);

  revalidatePath('/staff/settings');
  revalidatePath('/staff/dashboard');
  return { success: true };
}
