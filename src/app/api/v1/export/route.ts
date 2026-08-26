import { NextResponse } from 'next/server';
import { exportService } from '@/lib/services/export.service';
import { requireBranchAccess } from '@/lib/auth/branch-access';
import { getActorStaffId } from '@/lib/auth/membership-access';
import { logger } from '@/lib/logging/logger';
import prisma from '@/lib/db/prisma';

export async function GET(request: Request) {
  const url = new URL(request.url);
  const type = url.searchParams.get('type');
  const branchId = url.searchParams.get('branchId');

  try {
    if (!branchId) {
      return NextResponse.json({ error: 'branchId is required' }, { status: 400 });
    }

    if (!type || !['members', 'invoices'].includes(type)) {
      return NextResponse.json({ error: 'Valid export type (members, invoices) is required' }, { status: 400 });
    }

    // Branch Authorization Boundary
    await requireBranchAccess(branchId);
    const staffId = await getActorStaffId();

    let csvContent = '';

    if (type === 'members') {
      csvContent = await exportService.exportMembersCsv(branchId);
    } else if (type === 'invoices') {
      csvContent = await exportService.exportInvoicesCsv(branchId);
    }

    // Log the export action securely
    await prisma.businessActivityLog.create({
      data: {
        entityType: 'BRANCH',
        entityId: branchId,
        action: `EXPORT_${type.toUpperCase()}`,
        actorId: staffId,
        branchId: branchId,
      }
    });

    logger.info(`CSV Export generated for ${type}`, { branchId, staffId, action: 'export' });

    return new NextResponse(csvContent, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="export-${type}-${Date.now()}.csv"`,
      },
    });

  } catch (error: any) {
    logger.error('Export failed', error);
    if (error.name === 'AuthorizationError' || error.message.includes('permission')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
