import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "../lib/utils";

const badgeVariants = cva("inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium", {
  variants: {
    variant: {
      default: "bg-cyan-300/12 text-cyan-200 ring-1 ring-cyan-300/25",
      secondary: "bg-white/8 text-zinc-300 ring-1 ring-white/10",
      success: "bg-emerald-400/12 text-emerald-200 ring-1 ring-emerald-300/25",
      warning: "bg-amber-300/12 text-amber-200 ring-1 ring-amber-300/25"
    }
  },
  defaultVariants: {
    variant: "default"
  }
});

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement>, VariantProps<typeof badgeVariants> {}

export function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />;
}
