import prisma from '@/lib/db/prisma';

export class MeasurementService {
  /**
   * Append a new measurement. Negative numbers and invalid body fat have already been rejected by Zod schema.
   */
  static async recordMeasurement(memberId: string, data: any, recordedBy: string) {
    return prisma.measurement.create({
      data: {
        memberId,
        recordedBy,
        ...data
      }
    });
  }

  static async getMemberMeasurements(memberId: string) {
    return prisma.measurement.findMany({
      where: { memberId },
      orderBy: { recordedAt: 'asc' }
    });
  }

  static async getLatestMeasurement(memberId: string) {
    return prisma.measurement.findFirst({
      where: { memberId },
      orderBy: { recordedAt: 'desc' }
    });
  }

  /**
   * Analytics calculation. Does not assume missing = 0.
   */
  static async getWeightChange(memberId: string): Promise<{ change: number | null, percentage: number | null, message: string }> {
    const measurements = await prisma.measurement.findMany({
      where: { memberId, weight: { not: null } },
      orderBy: { recordedAt: 'asc' }
    });

    if (measurements.length < 2) {
      return { change: null, percentage: null, message: "Insufficient data to calculate weight change." };
    }

    const first = Number(measurements[0]!.weight);
    const last = Number(measurements[measurements.length - 1]!.weight);

    const change = last - first;
    const percentage = (change / first) * 100;

    return { change, percentage, message: `Weight changed by ${change.toFixed(2)} ${measurements[0]!.weightUnit}` };
  }
}
