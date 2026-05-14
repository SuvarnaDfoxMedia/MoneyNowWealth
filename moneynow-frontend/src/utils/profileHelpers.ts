import type { UserProfile } from "@/hooks/useProfile";

type UnknownRecord = Record<string, unknown>;

const PROFILE_COMPLETION_FIELDS = [
  ["firstname"],
  ["lastname"],
  ["email"],
  ["phone"],
  ["countryCode"],
  ["address"],
  ["profileImage"],
] as const;

const isFilledValue = (value: unknown): boolean => {
  if (value === null || value === undefined) return false;
  if (typeof value === "string") return value.trim().length > 0;
  if (Array.isArray(value)) return value.length > 0;
  if (typeof value === "object") return Object.keys(value as UnknownRecord).length > 0;
  return true;
};

const readPath = (obj: UnknownRecord, path: readonly string[]) =>
  path.reduce<unknown>((acc, key) => {
    if (!acc || typeof acc !== "object") return undefined;
    return (acc as UnknownRecord)[key];
  }, obj);

export const getProfileCompletion = (profile?: Partial<UserProfile> | null): number => {
  if (!profile) return 0;

  const total = PROFILE_COMPLETION_FIELDS.length;
  const completed = PROFILE_COMPLETION_FIELDS.reduce((count, path) => {
    return count + (isFilledValue(readPath(profile as UnknownRecord, path)) ? 1 : 0);
  }, 0);

  return Math.round((completed / total) * 100);
};

export const getPreferredUserName = (profile?: Partial<UserProfile> | null): string => {
  if (!profile) return "";

   const firstName = String(profile.firstname ?? "").trim();
  if (firstName) return firstName;

  const asRecord = profile as UnknownRecord;

  const firstLast = `${String(profile.firstname ?? "").trim()} ${String(profile.lastname ?? "").trim()}`.trim();
  if (firstLast) return firstLast;

  const fullName = String(asRecord.fullName ?? profile.name ?? "").trim();
  if (fullName) return fullName;

  const username = String(asRecord.username ?? "").trim();
  if (username) return username;

  return "";
};
