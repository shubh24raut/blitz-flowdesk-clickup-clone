"use client";

import { Check } from "lucide-react";
import { DropdownMenu as Primitive } from "radix-ui";
import type { ComponentProps } from "react";
import { cn } from "@/lib/utils";

export const DropdownMenu = Primitive.Root;
export const DropdownMenuTrigger = Primitive.Trigger;
export const DropdownMenuGroup = Primitive.Group;
export const DropdownMenuSub = Primitive.Sub;
export const DropdownMenuRadioGroup = Primitive.RadioGroup;

const surface =
  "z-50 max-h-[var(--radix-dropdown-menu-content-available-height)] min-w-44 overflow-y-auto rounded-xl border border-border bg-popover p-1 text-sm text-foreground shadow-overlay data-[state=open]:animate-fade-in";

export function DropdownMenuContent({
  className,
  sideOffset = 6,
  align = "end",
  ...props
}: ComponentProps<typeof Primitive.Content>) {
  return (
    <Primitive.Portal>
      <Primitive.Content sideOffset={sideOffset} align={align} className={cn(surface, className)} {...props} />
    </Primitive.Portal>
  );
}

const itemClass =
  "relative flex cursor-pointer select-none items-center gap-2 rounded-lg px-2.5 py-2 outline-none transition-colors data-[disabled]:pointer-events-none data-[disabled]:opacity-50 data-[highlighted]:bg-muted [&_svg]:size-4 [&_svg]:shrink-0 [&_svg]:text-muted-foreground";

export function DropdownMenuItem({
  className,
  destructive,
  ...props
}: ComponentProps<typeof Primitive.Item> & { destructive?: boolean }) {
  return (
    <Primitive.Item
      className={cn(
        itemClass,
        destructive &&
          "text-red-600 data-[highlighted]:bg-red-50 dark:text-red-400 dark:data-[highlighted]:bg-red-500/10 [&_svg]:text-red-500",
        className,
      )}
      {...props}
    />
  );
}

export function DropdownMenuCheckboxItem({ className, children, ...props }: ComponentProps<typeof Primitive.CheckboxItem>) {
  return (
    <Primitive.CheckboxItem className={cn(itemClass, "pr-8", className)} {...props}>
      {children}
      <Primitive.ItemIndicator className="absolute right-2.5 flex">
        <Check className="!text-primary" />
      </Primitive.ItemIndicator>
    </Primitive.CheckboxItem>
  );
}

export function DropdownMenuRadioItem({ className, children, ...props }: ComponentProps<typeof Primitive.RadioItem>) {
  return (
    <Primitive.RadioItem className={cn(itemClass, "pr-8", className)} {...props}>
      {children}
      <Primitive.ItemIndicator className="absolute right-2.5 flex">
        <Check className="!text-primary" />
      </Primitive.ItemIndicator>
    </Primitive.RadioItem>
  );
}

export function DropdownMenuLabel({ className, ...props }: ComponentProps<typeof Primitive.Label>) {
  return <Primitive.Label className={cn("px-2.5 py-1.5 text-xs font-medium text-muted-foreground", className)} {...props} />;
}

export function DropdownMenuSeparator({ className, ...props }: ComponentProps<typeof Primitive.Separator>) {
  return <Primitive.Separator className={cn("-mx-1 my-1 h-px bg-border", className)} {...props} />;
}

export function DropdownMenuSubTrigger({ className, ...props }: ComponentProps<typeof Primitive.SubTrigger>) {
  return <Primitive.SubTrigger className={cn(itemClass, "data-[state=open]:bg-muted", className)} {...props} />;
}

export function DropdownMenuSubContent({ className, ...props }: ComponentProps<typeof Primitive.SubContent>) {
  return (
    <Primitive.Portal>
      <Primitive.SubContent className={cn(surface, className)} {...props} />
    </Primitive.Portal>
  );
}
