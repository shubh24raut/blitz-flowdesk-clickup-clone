"use client";

import { format } from "date-fns";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogBody, DialogContent, DialogFooter } from "@/components/ui/dialog";
import { Field, FieldError } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { getNationalHolidays, listCountries, listRegions, type HolidayCandidate, type RegionOption } from "@/lib/holidays";
import { fromDateKey } from "@/lib/time-off";
import { importHolidays } from "@/store/actions/time-off";
import { useWorkspace } from "@/store/hooks";

const WHOLE_COUNTRY = "";

export function ImportHolidaysDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent title="Import national holidays" description="Public and optional holidays for a country or state." size="md">
        {open && <ImportForm onDone={() => onOpenChange(false)} />}
      </DialogContent>
    </Dialog>
  );
}

type Preview = { key: string; items: HolidayCandidate[] } | { key: string; error: string };

function ImportForm({ onDone }: { onDone: () => void }) {
  const state = useWorkspace();
  const fallback = state.holidayCalendars.find((c) => c.id === state.organization.defaultHolidayCalendarId);
  const thisYear = new Date().getFullYear();
  const [countries, setCountries] = useState<RegionOption[] | null>(null);
  const [regions, setRegions] = useState<{ country: string; options: RegionOption[] } | null>(null);
  const [country, setCountry] = useState(fallback?.countryCode ?? "IN");
  const [region, setRegion] = useState(fallback?.regionCode ?? WHOLE_COUNTRY);
  const [year, setYear] = useState(thisYear);
  const [preview, setPreview] = useState<Preview | null>(null);
  const previewKey = `${country}|${region}|${year}`;

  useEffect(() => {
    listCountries().then(setCountries, () => setCountries([]));
  }, []);

  useEffect(() => {
    let active = true;
    listRegions(country).then((options) => active && setRegions({ country, options }));
    return () => {
      active = false;
    };
  }, [country]);

  useEffect(() => {
    let active = true;
    getNationalHolidays(country, region || null, year).then(
      (items) => active && setPreview({ key: previewKey, items }),
      () => active && setPreview({ key: previewKey, error: "Couldn't load holidays for that selection." }),
    );
    return () => {
      active = false;
    };
  }, [country, region, year, previewKey]);

  const current = preview?.key === previewKey ? preview : null;
  const items = current && "items" in current ? current.items : [];
  const countryName = countries?.find((c) => c.code === country)?.name ?? country;
  const regionName = regions?.options.find((r) => r.code === region)?.name;
  const regionOptions = regions?.country === country ? regions.options : [];

  function submit() {
    const { calendar, added } = importHolidays(
      { countryCode: country, regionCode: region || null, name: regionName ? `${countryName} — ${regionName}` : countryName },
      items,
    );
    toast.success(added ? `Added ${added} holidays to ${calendar.name}` : `${calendar.name} is already up to date`);
    onDone();
  }

  return (
    <>
      <DialogBody className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-[1fr_1fr_100px]">
          <Field label="Country" htmlFor="import-country">
            {countries ? (
              <Select
                id="import-country"
                value={country}
                onValueChange={(v) => {
                  setCountry(v);
                  setRegion(WHOLE_COUNTRY);
                }}
                options={countries.map((c) => ({ value: c.code, label: c.name }))}
              />
            ) : (
              <Skeleton className="h-10 rounded-lg" />
            )}
          </Field>
          <Field label="State / region" htmlFor="import-region">
            <Select
              id="import-region"
              value={region}
              onValueChange={setRegion}
              disabled={regionOptions.length === 0}
              options={[{ value: WHOLE_COUNTRY, label: "Whole country" }, ...regionOptions.map((r) => ({ value: r.code, label: r.name }))]}
            />
          </Field>
          <Field label="Year" htmlFor="import-year">
            <Select
              id="import-year"
              value={String(year)}
              onValueChange={(v) => setYear(Number(v))}
              options={[thisYear, thisYear + 1].map((y) => ({ value: String(y), label: String(y) }))}
            />
          </Field>
        </div>

        <div className="rounded-xl border border-border">
          <p className="border-b border-border px-3.5 py-2.5 text-xs font-medium text-muted-foreground">
            {current && "items" in current ? `${items.length} holidays found` : "Loading…"}
          </p>
          <ul className="scrollbar-thin max-h-64 divide-y divide-border overflow-y-auto">
            {!current &&
              Array.from({ length: 4 }, (_, i) => (
                <li key={i} className="px-3.5 py-2.5">
                  <Skeleton className="h-4 w-2/3" />
                </li>
              ))}
            {items.map((h) => (
              <li key={h.date + h.name} className="flex items-center justify-between gap-3 px-3.5 py-2.5 text-sm">
                <span className="truncate">{h.name}</span>
                <span className="shrink-0 text-xs text-muted-foreground">
                  {format(fromDateKey(h.date), "EEE, d MMM")}
                  {h.kind === "optional" && " · optional"}
                </span>
              </li>
            ))}
          </ul>
        </div>
        {current && "error" in current && <FieldError message={current.error} />}
        <p className="text-xs text-muted-foreground">
          Festivals that follow the lunar calendar (Diwali, Holi, Eid…) often aren&apos;t included — add them with “Add holiday”.
        </p>
      </DialogBody>
      <DialogFooter>
        <Button type="button" variant="secondary" onClick={onDone}>
          Cancel
        </Button>
        <Button type="button" onClick={submit} disabled={items.length === 0}>
          Import {items.length > 0 && items.length} holidays
        </Button>
      </DialogFooter>
    </>
  );
}
