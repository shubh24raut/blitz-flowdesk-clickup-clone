/* eslint-disable @next/next/no-img-element -- logos may be local data URLs */
import { cn, initials } from "@/lib/utils";
import type { Organization } from "@/types";

const SIZES = {
  xs: "size-6 rounded-md text-[10px]",
  sm: "size-8 rounded-lg text-xs",
  md: "size-9 rounded-lg text-xs",
  lg: "size-12 rounded-xl text-base",
  xl: "size-16 rounded-2xl text-xl",
};

/** Organization logo, or its initials (“Dream Kasper LLP” → DK) on the brand color. */
export function OrganizationAvatar({
  organization,
  size = "md",
  className,
}: {
  organization: Pick<Organization, "name" | "logoUrl">;
  size?: keyof typeof SIZES;
  className?: string;
}) {
  if (organization.logoUrl) {
    return (
      <img
        src={organization.logoUrl}
        alt=""
        className={cn("shrink-0 border border-border bg-card object-cover", SIZES[size], className)}
      />
    );
  }
  return (
    <span
      aria-hidden
      className={cn("grid shrink-0 select-none place-items-center bg-primary font-bold text-white", SIZES[size], className)}
    >
      {initials(organization.name || "?")}
    </span>
  );
}
