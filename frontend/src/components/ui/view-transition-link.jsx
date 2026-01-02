import * as React from "react";
import { Link as RouterLink } from "react-router-dom";
import { useViewTransition } from "@/hooks/useViewTransition";
import { cn } from "@/lib/utils";

/**
 * Enhanced Link component with View Transitions API support
 * Provides smooth page transitions when navigating between routes
 */
export const ViewTransitionLink = React.forwardRef(
  ({ to, children, className, onClick, viewTransitionName, ...props }, ref) => {
    const { transitionTo } = useViewTransition();

    const handleClick = (e) => {
      e.preventDefault();
      
      if (onClick) {
        onClick(e);
      }
      
      transitionTo(to);
    };

    return (
      <RouterLink
        ref={ref}
        to={to}
        onClick={handleClick}
        className={className}
        style={viewTransitionName ? { viewTransitionName } : undefined}
        {...props}
      >
        {children}
      </RouterLink>
    );
  }
);
ViewTransitionLink.displayName = "ViewTransitionLink";

/**
 * Page wrapper that applies view-transition-name for smooth transitions
 */
export const TransitionPage = React.forwardRef(
  ({ children, className, transitionName = "page-content", ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn("min-h-screen", className)}
        style={{ viewTransitionName: transitionName }}
        {...props}
      >
        {children}
      </div>
    );
  }
);
TransitionPage.displayName = "TransitionPage";
