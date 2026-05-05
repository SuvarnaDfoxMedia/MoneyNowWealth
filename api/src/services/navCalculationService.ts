import NavHistory from "../models/navHistoryModel";

export type ReturnWindow = "d1" | "m1" | "m3" | "m6" | "y1" | "y5" | "y10";

export type ReturnValue = {
  value: number | null;
  currentNav: number | null;
  pastNav: number | null;
  currentDate: Date | null;
  pastDate: Date | null;
  missingReason?: string;
};

const MS_PER_DAY = 24 * 60 * 60 * 1000;

export const roundTo3 = (value: number) => Number(value.toFixed(3));

export const normalizeDateOnly = (value: Date) => {
  const next = new Date(value);
  next.setHours(0, 0, 0, 0);
  return next;
};

export const calculateNAV = (
  totalAssets: number,
  totalLiabilities: number,
  totalUnits: number,
) => {
  if (!Number.isFinite(totalUnits) || totalUnits <= 0) {
    throw new Error("totalUnits must be greater than zero");
  }
  return roundTo3((totalAssets - totalLiabilities) / totalUnits);
};

export const calculateReturnValue = (
  currentNav: number | null | undefined,
  pastNav: number | null | undefined,
) => {
  if (
    currentNav === null ||
    currentNav === undefined ||
    pastNav === null ||
    pastNav === undefined
  ) {
    return null;
  }
  if (!Number.isFinite(currentNav) || !Number.isFinite(pastNav) || pastNav === 0) {
    return null;
  }
  return roundTo3((currentNav - pastNav) / pastNav);
};

const targetDateForWindow = (currentDate: Date, window: ReturnWindow) => {
  const target = normalizeDateOnly(currentDate);
  switch (window) {
    case "d1":
      target.setDate(target.getDate() - 1);
      break;
    case "m1":
      target.setMonth(target.getMonth() - 1);
      break;
    case "m3":
      target.setMonth(target.getMonth() - 3);
      break;
    case "m6":
      target.setMonth(target.getMonth() - 6);
      break;
    case "y5":
      target.setFullYear(target.getFullYear() - 5);
      break;
    case "y10":
      target.setFullYear(target.getFullYear() - 10);
      break;
    case "y1":
    default:
      target.setFullYear(target.getFullYear() - 1);
      break;
  }
  return target;
};

const findPastNav = async (schemeId: string, targetDate: Date, currentDate: Date) => {
  const targetStart = normalizeDateOnly(targetDate);
  const currentStart = normalizeDateOnly(currentDate);
  return NavHistory.findOne({
    schemeId,
    date: {
      $lte: targetStart,
      $lt: currentStart,
    },
  })
    .sort({ date: -1 })
    .lean();
};

export const calculateReturns = async (
  schemeId: string,
  currentDate?: Date,
): Promise<Record<ReturnWindow, ReturnValue>> => {
  const current = await NavHistory.findOne({
    schemeId,
    ...(currentDate ? { date: { $lte: normalizeDateOnly(currentDate) } } : {}),
  })
    .sort({ date: -1 })
    .lean();

  const empty = (reason: string): ReturnValue => ({
    value: null,
    currentNav: current?.nav ?? null,
    pastNav: null,
    currentDate: current?.date ?? null,
    pastDate: null,
    missingReason: reason,
  });

  if (!current) {
    return {
      d1: empty("Current NAV not found"),
      m1: empty("Current NAV not found"),
      m3: empty("Current NAV not found"),
      m6: empty("Current NAV not found"),
      y1: empty("Current NAV not found"),
      y5: empty("Current NAV not found"),
      y10: empty("Current NAV not found"),
    };
  }

  const windows: ReturnWindow[] = ["d1", "m1", "m3", "m6", "y1", "y5", "y10"];
  const entries = await Promise.all(
    windows.map(async (window) => {
      const past = await findPastNav(
        schemeId,
        targetDateForWindow(current.date, window),
        current.date,
      );
      const value = calculateReturnValue(current.nav, past?.nav);
      return [
        window,
        {
          value,
          currentNav: current.nav,
          pastNav: past?.nav ?? null,
          currentDate: current.date,
          pastDate: past?.date ?? null,
          missingReason: past ? undefined : "Historical NAV not found",
        },
      ] as const;
    }),
  );

  return Object.fromEntries(entries) as Record<ReturnWindow, ReturnValue>;
};

export const startOfDay = (value: Date) => normalizeDateOnly(value);

export const subtractDays = (value: Date, days: number) =>
  new Date(normalizeDateOnly(value).getTime() - days * MS_PER_DAY);
