import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva } from "class-variance-authority";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-2xl text-sm font-semibold transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground shadow-sm hover:bg-primary-hover hover:shadow-md active:scale-[0.98]",
        destructive: "bg-destructive text-destructive-foreground shadow-sm hover:bg-destructive/90 hover:shadow-md active:scale-[0.98]",
        outline: "border border-zinc-200 dark:border-zinc-800 bg-transparent hover:bg-zinc-50 dark:hover:bg-zinc-800/50 hover:border-zinc-300 dark:hover:border-zinc-700",
        secondary: "bg-secondary text-secondary-foreground hover:bg-zinc-200/80 dark:hover:bg-zinc-700/50",
        ghost: "hover:bg-zinc-100 dark:hover:bg-zinc-800/50 hover:text-accent-foreground",
        link: "text-primary underline-offset-4 hover:underline",
        success: "bg-success text-success-foreground shadow-sm hover:bg-success/90 hover:shadow-md active:scale-[0.98]",
      },
      size: {
        default: "h-11 px-5 py-2",
        sm: "h-9 rounded-xl px-4 text-xs",
        lg: "h-12 rounded-2xl px-8 text-base",
        icon: "h-11 w-11",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

const Button = React.forwardRef(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";

// Animated button variant with Framer Motion for enhanced interactions
// Note: asChild prop is not supported with motion animations.
// When asChild is true, the component falls back to regular Button without animations.
// For animated links, use motion.a directly or wrap Link component with MotionDiv.
const MotionButton = React.forwardRef(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    if (asChild) {
      // For asChild, fallback to regular Button since Slot doesn't work well with motion
      console.warn('MotionButton: asChild prop disables motion animations. Use regular Button or motion.a for links.');
      return <Button className={className} variant={variant} size={size} asChild ref={ref} {...props} />;
    }
    
    return (
      <motion.button
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        transition={{
          type: "spring",
          stiffness: 400,
          damping: 25,
        }}
        {...props}
      />
    );
  }
);
MotionButton.displayName = "MotionButton";

export { Button, MotionButton, buttonVariants };
