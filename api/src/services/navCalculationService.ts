import NavHistory from "../models/navHistoryModel";

export type ReturnWindow = "d1" | "m1" | "y1";

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
  if (window === "d1") {
    target.setDate(target.getDate() - 1);
  } else if (window === "m1") {
    target.setMonth(target.getMonth() - 1);
  } else {
    target.setFullYear(target.getFullYear() - 1);
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
      y1: empty("Current NAV not found"),
    };
  }

  const windows: ReturnWindow[] = ["d1", "m1", "y1"];
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
