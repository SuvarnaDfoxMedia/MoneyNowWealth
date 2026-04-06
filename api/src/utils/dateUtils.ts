export const getMidnight = (date: Date): Date => {
  const midnight = new Date(date);
  midnight.setHours(0, 0, 0, 0);
  return midnight;
};

export const getEndOfDay = (date: Date): Date => {
  const endOfDay = new Date(date);
  endOfDay.setHours(23, 59, 59, 999);
  return endOfDay;
};

export const isExpiredByDay = (
  endDate: Date,
  compareDate: Date = new Date(),
): boolean => {
  return getMidnight(endDate).getTime() < getMidnight(compareDate).getTime();
};

export const isActiveByDay = (
  endDate: Date,
  compareDate: Date = new Date(),
): boolean => {
  return !isExpiredByDay(endDate, compareDate);
};

export const getRemainingDaysInclusive = (
  endDate: Date,
  compareDate: Date = new Date(),
): number => {
  const diffMs =
    getMidnight(endDate).getTime() - getMidnight(compareDate).getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  return Math.max(0, diffDays + 1);
};

export const addDurationToDate = (
  date: Date,
  value: number,
  unit: "day" | "month" | "year",
): Date => {
  const result = new Date(date);
  switch (unit) {
    case "day":
      result.setDate(result.getDate() + value);
      break;
    case "month":
      result.setMonth(result.getMonth() + value);
      break;
    case "year":
      result.setFullYear(result.getFullYear() + value);
      break;
  }
  return result;
};

export const isCreated24HoursAgo = (createdAt: Date): boolean => {
  const now = new Date();
  const hoursDiff = (now.getTime() - createdAt.getTime()) / (1000 * 60 * 60);
  return hoursDiff >= 24;
};

export const getTomorrowMidnight = (): Date => {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(0, 0, 0, 0);
  return tomorrow;
};
