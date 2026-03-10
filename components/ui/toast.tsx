"use client";

import * as React from "react";
import { createContext, useContext, useCallback, useState } from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

interface Toast {
    id: string;
    title: string;
    description?: string;
    variant?: "default" | "destructive" | "success";
}

interface ToastContextType {
    toasts: Toast[];
    addToast: (toast: Omit<Toast, "id">) => void;
    removeToast: (id: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function useToast() {
    const context = useContext(ToastContext);
    if (!context) {
        throw new Error("useToast must be used within a ToastProvider");
    }
    return context;
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
    const [toasts, setToasts] = useState<Toast[]>([]);

    const addToast = useCallback((toast: Omit<Toast, "id">) => {
        const id = Math.random().toString(36).substr(2, 9);
        setToasts((prev) => [...prev, { ...toast, id }]);
        setTimeout(() => {
            setToasts((prev) => prev.filter((t) => t.id !== id));
        }, 5000);
    }, []);

    const removeToast = useCallback((id: string) => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
    }, []);

    return (
        <ToastContext.Provider value={{ toasts, addToast, removeToast }}>
            {children}
            <div className="fixed bottom-4 right-4 z-[100] flex flex-col gap-2 max-w-sm">
                {toasts.map((toast) => {
                    const variants: Record<string, string> = {
                        default: "bg-white border-zinc-200",
                        destructive: "bg-red-50 border-red-200 text-red-900",
                        success: "bg-emerald-50 border-emerald-200 text-emerald-900",
                    };
                    return (
                        <div
                            key={toast.id}
                            className={cn(
                                "flex items-start gap-3 rounded-xl border p-4 shadow-lg animate-in slide-in-from-right-full duration-300",
                                variants[toast.variant || "default"]
                            )}
                        >
                            <div className="flex-1">
                                <p className="text-sm font-semibold">{toast.title}</p>
                                {toast.description && (
                                    <p className="text-sm opacity-80 mt-1">{toast.description}</p>
                                )}
                            </div>
                            <button
                                onClick={() => removeToast(toast.id)}
                                className="opacity-70 hover:opacity-100 transition-opacity cursor-pointer"
                            >
                                <X className="h-4 w-4" />
                            </button>
                        </div>
                    );
                })}
            </div>
        </ToastContext.Provider>
    );
}
