"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { loginAction, seedAdminAction } from "@/actions/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { GraduationCap, Loader2 } from "lucide-react";

export default function LoginPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [seeding, setSeeding] = useState(false);
    const [error, setError] = useState("");
    const [seedMessage, setSeedMessage] = useState("");
    const [selectedRole, setSelectedRole] = useState("admin");

    async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault();
        setLoading(true);
        setError("");

        const formData = new FormData(e.currentTarget);
        formData.set("role", selectedRole);

        const result = await loginAction(formData);

        if (result.success) {
            router.push("/dashboard");
            router.refresh();
        } else {
            setError(result.message);
            setLoading(false);
        }
    }

    async function handleSeedAdmin() {
        setSeeding(true);
        setSeedMessage("");
        const result = await seedAdminAction();
        setSeedMessage(result.message);
        setSeeding(false);
    }

    const roles = [
        { value: "admin", label: "Admin", color: "bg-zinc-900 text-white" },
        { value: "faculty", label: "Faculty", color: "bg-blue-600 text-white" },
        { value: "student", label: "Student", color: "bg-emerald-600 text-white" },
    ];

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-zinc-50 via-white to-zinc-100 p-4">
            {/* Background pattern */}
            <div className="fixed inset-0 -z-10">
                <div className="absolute inset-0 bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:20px_20px] opacity-50" />
            </div>

            <div className="w-full max-w-md">
                {/* Logo + Heading */}
                <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-zinc-900 text-white mb-4 shadow-lg">
                        <GraduationCap className="w-7 h-7" />
                    </div>
                    <h1 className="text-2xl font-bold text-zinc-900 tracking-tight">
                        Student Project Management
                    </h1>
                    <p className="text-zinc-500 mt-1 text-sm">Sign in to your account to continue</p>
                </div>

                <Card className="shadow-xl border-zinc-200/80">
                    <CardHeader className="pb-4">
                        <CardTitle className="text-lg">Sign In</CardTitle>
                        <CardDescription>Choose your role and enter credentials</CardDescription>
                    </CardHeader>
                    <CardContent>
                        {/* Role selector */}
                        <div className="flex gap-2 mb-6">
                            {roles.map((role) => (
                                <button
                                    key={role.value}
                                    type="button"
                                    onClick={() => setSelectedRole(role.value)}
                                    className={`flex-1 py-2.5 px-3 rounded-lg text-sm font-medium transition-all duration-200 cursor-pointer border ${selectedRole === role.value
                                            ? `${role.color} border-transparent shadow-md scale-[1.02]`
                                            : "bg-white text-zinc-600 border-zinc-200 hover:bg-zinc-50"
                                        }`}
                                >
                                    {role.label}
                                </button>
                            ))}
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="email">Email</Label>
                                <Input
                                    id="email"
                                    name="email"
                                    type="email"
                                    placeholder="admin@spms.com"
                                    required
                                    autoComplete="email"
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="password">Password</Label>
                                <Input
                                    id="password"
                                    name="password"
                                    type="password"
                                    placeholder="••••••••"
                                    required
                                    autoComplete="current-password"
                                />
                            </div>

                            {error && (
                                <div className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">
                                    {error}
                                </div>
                            )}

                            <Button type="submit" className="w-full" disabled={loading}>
                                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                {loading ? "Signing in..." : "Sign In"}
                            </Button>
                        </form>

                        {/* Seed admin helper */}
                        <div className="mt-6 pt-4 border-t border-zinc-100">
                            <p className="text-xs text-zinc-400 text-center mb-2">First time? Set up admin account</p>
                            <Button
                                variant="outline"
                                size="sm"
                                className="w-full"
                                onClick={handleSeedAdmin}
                                disabled={seeding}
                            >
                                {seeding && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Initialize Admin Account
                            </Button>
                            {seedMessage && (
                                <p className="text-xs text-center mt-2 text-emerald-600">{seedMessage}</p>
                            )}
                        </div>
                    </CardContent>
                </Card>

                <p className="text-xs text-zinc-400 text-center mt-6">
                    SPMS — Student Project Management System
                </p>
            </div>
        </div>
    );
}
