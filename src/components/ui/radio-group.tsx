"use client";

import { cn } from "cn";
import { RadioGroup as RadioGroupPrimitive } from "radix-ui";
import * as React from "react";

function RadioGroup({
  className,
  ...props
}: React.ComponentProps<typeof RadioGroupPrimitive.Root>) {
  return (
    <RadioGroupPrimitive.Root
      data-slot="radio-group"
      className={cn("grid gap-2", className)}
      {...props}
    />
  );
}

/** A choice drawn as a card: the whole card is the radio, its content the label */
function RadioGroupCard({
  className,
  ...props
}: React.ComponentProps<typeof RadioGroupPrimitive.Item>) {
  return (
    <RadioGroupPrimitive.Item
      data-slot="radio-group-card"
      className={cn(
        "cursor-pointer rounded-xl border border-white/10 p-3 text-left text-sm transition-colors outline-none hover:border-white/25 focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50 data-[state=checked]:border-brand/50 data-[state=checked]:bg-brand/10",
        className,
      )}
      {...props}
    />
  );
}

export { RadioGroup, RadioGroupCard };
