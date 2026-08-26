export interface MobileMeasurementDTO {
  id: string;
  date: string;
  weight: number | null;
  weightUnit: string | null;
  bodyFatPercentage: number | null;
  notes: string | null;
}

export class MeasurementDTO {
  static toMobile(measurement: any /* eslint-disable-line @typescript-eslint/no-explicit-any */): MobileMeasurementDTO {
    return {
      id: measurement.id,
      date: measurement.date.toISOString(),
      weight: measurement.weight ? Number(measurement.weight) : null,
      weightUnit: measurement.weightUnit,
      bodyFatPercentage: measurement.bodyFatPercentage ? Number(measurement.bodyFatPercentage) : null,
      notes: measurement.notes,
    };
  }
}
