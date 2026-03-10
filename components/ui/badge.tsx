import * as React from "react";
import { cn } from "@/lib/utils";

const Badge = React.forwardRef<
    HTMLDivElement,
    React.HTMLAttributes<HTMLDivElement> & {
        variant?: "default" | "secondary" | "destructive" | "outline" | "success" | "warning";
    }
>(({ className, variant = "default", ...props }, ref) => {
    const variants: Record<string, string> = {
        default: "bg-zinc-900 text-white border-transparent",
        secondary: "bg-zinc-100 text-zinc-900 border-transparent",
        destructive: "bg-red-100 text-red-700 border-transparent",
        outline: "text-zinc-900 border-zinc-200",
        success: "bg-emerald-100 text-emerald-700 border-transparent",
        warning: "bg-amber-100 text-amber-700 border-transparent",
    };

    return (
        <div
            ref={ref}
            className={cn(
                "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors",
                variants[variant],
                className
            )}
            {...props}
        />
    );
});
Badge.displayName = "Badge";

export { Badge };
