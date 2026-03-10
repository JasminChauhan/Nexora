"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link";
    size?: "default" | "sm" | "lg" | "icon";
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
    ({ className, variant = "default", size = "default", ...props }, ref) => {
        const baseStyles =
            "inline-flex items-center justify-center whitespace-nowrap rounded-lg text-sm font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 cursor-pointer";

        const variants: Record<string, string> = {
            default: "bg-zinc-900 text-white hover:bg-zinc-800 shadow-sm",
            destructive: "bg-red-600 text-white hover:bg-red-700 shadow-sm",
            outline: "border border-zinc-200 bg-white hover:bg-zinc-50 hover:text-zinc-900",
            secondary: "bg-zinc-100 text-zinc-900 hover:bg-zinc-200",
            ghost: "hover:bg-zinc-100 hover:text-zinc-900",
            link: "text-blue-600 underline-offset-4 hover:underline",
        };

        const sizes: Record<string, string> = {
            default: "h-10 px-4 py-2",
            sm: "h-8 rounded-md px-3 text-xs",
            lg: "h-11 rounded-lg px-8",
            icon: "h-10 w-10",
        };

        return (
            <button
                className={cn(baseStyles, variants[variant], sizes[size], className)}
                ref={ref}
                {...props}
            />
        );
    }
);
Button.displayName = "Button";

export { Button };
