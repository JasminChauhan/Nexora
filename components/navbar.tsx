"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { logoutAction } from "@/actions/auth";
import {
    LogOut,
    Menu,
    X,
    GraduationCap,
    ChevronDown,
    UserCog,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { getNavItemsForRole } from "@/lib/roles";
import type { SessionUser } from "@/types";

interface NavbarProps {
    user: SessionUser;
}

const roleBadgeColors: Record<string, string> = {
    admin: "bg-zinc-900 text-white",
    faculty: "bg-blue-600 text-white",
    student: "bg-emerald-600 text-white",
};

export function Navbar({ user }: NavbarProps) {
    const pathname = usePathname();
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [profileOpen, setProfileOpen] = useState(false);

    // Get role-based nav items
    const navItems = getNavItemsForRole(user.role);

    const isActive = (href: string) => {
        if (href === "/dashboard") return pathname === "/dashboard";
        return pathname.startsWith(href);
    };

    return (
        <header className="sticky top-0 z-50 w-full border-b border-zinc-200/80 bg-white/80 backdrop-blur-xl supports-[backdrop-filter]:bg-white/60">
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                <div className="flex h-16 items-center justify-between">
                    {/* Logo */}
                    <Link href="/dashboard" className="flex items-center gap-2.5 shrink-0">
                        <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-zinc-900 text-white">
                            <GraduationCap className="w-4.5 h-4.5" />
                        </div>
                        <span className="font-semibold text-zinc-900 tracking-tight hidden sm:block">
                            SPMS
                        </span>
                    </Link>

                    {/* Desktop nav – role-specific items */}
                    <nav className="hidden lg:flex items-center gap-1 mx-4">
                        {navItems.map((item) => {
                            const Icon = item.icon;
                            return (
                                <Link
                                    key={item.href}
                                    href={item.href}
                                    className={cn(
                                        "flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200",
                                        isActive(item.href)
                                            ? "bg-zinc-900 text-white shadow-sm"
                                            : "text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100"
                                    )}
                                >
                                    <Icon className="w-4 h-4" />
                                    {item.label}
                                </Link>
                            );
                        })}
                    </nav>

                    {/* Profile / actions */}
                    <div className="flex items-center gap-3">
                        {/* Profile dropdown */}
                        <div className="relative">
                            <button
                                onClick={() => setProfileOpen(!profileOpen)}
                                className="flex items-center gap-2 px-3 py-1.5 rounded-lg hover:bg-zinc-100 transition-colors cursor-pointer"
                            >
                                <div className="w-7 h-7 rounded-full bg-gradient-to-br from-zinc-700 to-zinc-900 flex items-center justify-center text-white text-xs font-medium">
                                    {user.username.charAt(0).toUpperCase()}
                                </div>
                                <span className="text-sm font-medium text-zinc-700 hidden sm:block">
                                    {user.username}
                                </span>
                                <ChevronDown className="w-3.5 h-3.5 text-zinc-400" />
                            </button>

                            {profileOpen && (
                                <>
                                    <div
                                        className="fixed inset-0 z-40"
                                        onClick={() => setProfileOpen(false)}
                                    />
                                    <div className="absolute right-0 top-full mt-1 w-56 bg-white rounded-xl border border-zinc-200 shadow-xl z-50 py-1 animate-in">
                                        <div className="px-3 py-2.5 border-b border-zinc-100">
                                            <p className="text-sm font-medium text-zinc-900">{user.username}</p>
                                            <p className="text-xs text-zinc-500">{user.email}</p>
                                            <span className={cn(
                                                "inline-block mt-1 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider rounded-full",
                                                roleBadgeColors[user.role] || "bg-zinc-100 text-zinc-600"
                                            )}>
                                                {user.role}
                                            </span>
                                        </div>
                                        <Link
                                            href="/dashboard/profile"
                                            className="flex items-center gap-2 px-3 py-2 text-sm text-zinc-700 hover:bg-zinc-50 transition-colors"
                                            onClick={() => setProfileOpen(false)}
                                        >
                                            <UserCog className="w-4 h-4" />
                                            Profile
                                        </Link>
                                        <form action={logoutAction}>
                                            <button
                                                type="submit"
                                                className="flex items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors w-full text-left cursor-pointer"
                                            >
                                                <LogOut className="w-4 h-4" />
                                                Logout
                                            </button>
                                        </form>
                                    </div>
                                </>
                            )}
                        </div>

                        {/* Mobile menu button */}
                        <button
                            className="lg:hidden p-2 rounded-lg hover:bg-zinc-100 transition-colors cursor-pointer"
                            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                        >
                            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
                        </button>
                    </div>
                </div>
            </div>

            {/* Mobile menu – role-specific items */}
            {mobileMenuOpen && (
                <div className="lg:hidden border-t border-zinc-200/80 bg-white">
                    <nav className="mx-auto max-w-7xl px-4 py-3 space-y-1">
                        {navItems.map((item) => {
                            const Icon = item.icon;
                            return (
                                <Link
                                    key={item.href}
                                    href={item.href}
                                    onClick={() => setMobileMenuOpen(false)}
                                    className={cn(
                                        "flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm font-medium transition-all",
                                        isActive(item.href)
                                            ? "bg-zinc-900 text-white"
                                            : "text-zinc-600 hover:bg-zinc-100"
                                    )}
                                >
                                    <Icon className="w-4 h-4" />
                                    {item.label}
                                </Link>
                            );
                        })}
                    </nav>
                </div>
            )}
        </header>
    );
}
