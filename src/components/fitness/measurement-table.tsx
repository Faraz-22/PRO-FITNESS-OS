import React from 'react';

export function MeasurementTable({ measurements }: { measurements: any[] }) {
  if (!measurements || measurements.length === 0) {
    return (
      <div className="text-center py-8 bg-zinc-900/30 border border-dashed border-zinc-800 rounded-lg">
        <p className="text-zinc-500">No measurements recorded yet.</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-lg border border-zinc-800">
      <table className="w-full text-sm text-left text-zinc-300">
        <thead className="text-xs uppercase bg-zinc-900 text-zinc-400">
          <tr>
            <th className="px-6 py-3">Date</th>
            <th className="px-6 py-3">Weight</th>
            <th className="px-6 py-3">Body Fat</th>
            <th className="px-6 py-3">Chest</th>
            <th className="px-6 py-3">Waist</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-zinc-800 bg-zinc-950">
          {measurements.map((m) => (
            <tr key={m.id} className="hover:bg-zinc-900/50">
              <td className="px-6 py-4 whitespace-nowrap">
                {new Date(m.recordedAt).toLocaleDateString()}
              </td>
              <td className="px-6 py-4">
                {m.weight ? `${Number(m.weight)} ${m.weightUnit}` : '-'}
              </td>
              <td className="px-6 py-4">
                {m.bodyFatPercentage ? `${Number(m.bodyFatPercentage)}%` : '-'}
              </td>
              <td className="px-6 py-4">
                {m.chest ? `${Number(m.chest)} ${m.lengthUnit}` : '-'}
              </td>
              <td className="px-6 py-4">
                {m.waist ? `${Number(m.waist)} ${m.lengthUnit}` : '-'}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
