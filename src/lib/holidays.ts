import type { DateKey, HolidayKind } from "@/types";

/**
 * National holiday lookup backed by `date-holidays` (~200 countries and their states, offline).
 * The package is large, so it is loaded on demand — only when someone imports holidays.
 * Once the backend exists this moves into `holiday.service.ts` and runs on the server.
 */

async function load() {
  const { default: Holidays } = await import("date-holidays");
  return Holidays;
}

export interface RegionOption {
  code: string;
  name: string;
}

const toOptions = (map: Record<string, string> | undefined): RegionOption[] =>
  Object.entries(map ?? {})
    .map(([code, name]) => ({ code, name }))
    .sort((a, b) => a.name.localeCompare(b.name));

export async function listCountries(): Promise<RegionOption[]> {
  const Holidays = await load();
  return toOptions(new Holidays().getCountries("en"));
}

export async function listRegions(countryCode: string): Promise<RegionOption[]> {
  const Holidays = await load();
  return toOptions(new Holidays().getStates(countryCode, "en"));
}

export interface HolidayCandidate {
  date: DateKey;
  name: string;
  kind: Extract<HolidayKind, "public" | "optional">;
}

/** Public and optional holidays for a year. Observances (Mother's Day, Halloween, …) are skipped. */
export async function getNationalHolidays(countryCode: string, regionCode: string | null, year: number): Promise<HolidayCandidate[]> {
  const Holidays = await load();
  const hd = regionCode ? new Holidays(countryCode, regionCode) : new Holidays(countryCode);
  const seen = new Set<string>();
  const result: HolidayCandidate[] = [];
  for (const h of hd.getHolidays(year, "en")) {
    if (h.type !== "public" && h.type !== "optional") continue;
    const date = h.date.slice(0, 10);
    if (seen.has(date + h.name)) continue;
    seen.add(date + h.name);
    result.push({ date, name: h.name, kind: h.type });
  }
  return result;
}
