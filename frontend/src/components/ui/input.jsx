import * as React from "react";
import { cn } from "@/lib/utils";

const Input = React.forwardRef(({ className, type, ...props }, ref) => {
  return (
    <input
      type={type}
      className={cn(
        "flex h-11 w-full rounded-2xl px-4 py-2",
        "bg-zinc-50 dark:bg-zinc-900/50",
        "border border-zinc-200/80 dark:border-zinc-800/80",
        "text-foreground text-sm font-medium",
        "placeholder:text-zinc-400 dark:placeholder:text-zinc-500",
        "transition-all duration-200",
        "hover:border-zinc-300 dark:hover:border-zinc-700",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:border-primary",
        "disabled:cursor-not-allowed disabled:opacity-50",
        "file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground",
        className
      )}
      ref={ref}
      {...props}
    />
  );
});
Input.displayName = "Input";

export { Input };
