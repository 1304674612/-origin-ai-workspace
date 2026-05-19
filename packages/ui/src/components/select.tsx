import * as React from "react";

import { cn } from "../lib/utils";

const Select = React.forwardRef<HTMLSelectElement, React.SelectHTMLAttributes<HTMLSelectElement>>(
  ({ className, children, ...props }, ref) => (
    <select
      ref={ref}
      className={cn(
        "h-10 rounded-md border border-white/10 bg-zinc-950 px-3 text-sm text-white outline-none transition focus:ring-2 focus:ring-cyan-300/60",
        className
      )}
      {...props}
    >
      {children}
    </select>
  )
);
Select.displayName = "Select";

export { Select };
