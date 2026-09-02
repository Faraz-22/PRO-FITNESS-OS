import prisma from '@/lib/db/prisma';

export default async function MemberAttendancePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const records = await prisma.attendanceRecord.findMany({
    where: { memberId: id },
    orderBy: { checkInTime: 'desc' },
    include: { branch: true }
  });

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold mb-6">Member Attendance History</h1>
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Branch</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Check In</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Check Out</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Decision</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {records.map(record => (
              <tr key={record.id}>
                <td className="px-6 py-4 text-sm text-gray-900">{record.checkInTime.toLocaleDateString('en-IN', { timeZone: 'Asia/Kolkata' })}</td>
                <td className="px-6 py-4 text-sm text-gray-500">{record.branch.name}</td>
                <td className="px-6 py-4 text-sm text-gray-500">{record.checkInTime.toLocaleTimeString('en-IN', { timeZone: 'Asia/Kolkata' })}</td>
                <td className="px-6 py-4 text-sm text-gray-500">{record.checkOutTime?.toLocaleTimeString('en-IN', { timeZone: 'Asia/Kolkata' }) || '-'}</td>
                <td className="px-6 py-4 text-sm font-medium">
                  {record.accessDecision === 'ALLOWED' ? <span className="text-green-600">Allowed</span> : <span className="text-red-600">Denied</span>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
