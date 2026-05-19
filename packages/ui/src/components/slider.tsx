import * as React from "react";

import { cn } from "../lib/utils";

const Slider = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  ({ className, type = "range", ...props }, ref) => (
    <input
      type={type}
      ref={ref}
      className={cn(
        "h-2 w-full cursor-pointer appearance-none rounded-full bg-white/10 accent-cyan-300",
        className
      )}
      {...props}
    />
  )
);
Slider.displayName = "Slider";

export { Slider };
