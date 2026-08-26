import prisma from '@/lib/db/prisma';

export default async function AccessControlDashboard() {
  const devices = await prisma.accessDevice.findMany({
    include: { branch: true }
  });

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold mb-6">Access Control Devices</h1>
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Device</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Branch</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">IP Address</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Last Sync</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {devices.map(device => (
              <tr key={device.id}>
                <td className="px-6 py-4 text-sm font-medium text-gray-900">{device.name}</td>
                <td className="px-6 py-4 text-sm text-gray-500">{device.branch.name}</td>
                <td className="px-6 py-4 text-sm text-gray-500">{device.ipAddress}</td>
                <td className="px-6 py-4 text-sm text-gray-500">{device.isActive ? 'Active' : 'Inactive'}</td>
                <td className="px-6 py-4 text-sm text-gray-500">{device.lastSyncAt?.toLocaleString() || 'Never'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
