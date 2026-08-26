export function getIndianFinancialYear(date: Date = new Date()): string {
  const year = date.getFullYear();
  const month = date.getMonth(); // 0-indexed (0 = Jan, 3 = Apr, etc)

  let startYear: number;
  let endYear: number;

  if (month >= 3) {
    // April to December
    startYear = year;
    endYear = year + 1;
  } else {
    // January to March
    startYear = year - 1;
    endYear = year;
  }

  const shortStart = startYear.toString().slice(-2);
  const shortEnd = endYear.toString().slice(-2);

  return `FY${shortStart}${shortEnd}`;
}
