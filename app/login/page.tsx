"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { loginAction, registerAdminAction } from "@/actions/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { GraduationCap, Loader2 } from "lucide-react";

export default function LoginPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [successMessage, setSuccessMessage] = useState("");
    const [selectedRole, setSelectedRole] = useState("admin");
    const [isRegistering, setIsRegistering] = useState(false);

    async function handleLoginSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault();
        setLoading(true);
        setError("");
        setSuccessMessage("");

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

    async function handleRegisterSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault();
        setLoading(true);
        setError("");
        setSuccessMessage("");

        const formData = new FormData(e.currentTarget);
        const result = await registerAdminAction(formData);

        if (result.success) {
            setSuccessMessage(result.message);
            setIsRegistering(false); // Switch back to login
            setLoading(false);
        } else {
            setError(result.message);
            setLoading(false);
        }
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
                    <img className="mx-auto w-20 h-20 object-contain mb-4 drop-shadow-sm rounded-lg" src="/Logo_new.png" alt="Nexora Logo" />
                    <h1 className="text-2xl font-bold text-zinc-900 tracking-tight">
                        Nexora
                    </h1>
                    <p className="text-zinc-500 mt-1 text-sm">
                        {isRegistering ? "Register a new administrator account" : "Sign in to your account to continue"}
                    </p>
                </div>

                <Card className="shadow-xl border-zinc-200/80">
                    <CardHeader className="pb-4">
                        <CardTitle className="text-lg">{isRegistering ? "Admin Registration" : "Sign In"}</CardTitle>
                        <CardDescription>
                            {isRegistering ? "Create a new admin user" : "Choose your role and enter credentials"}
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        {successMessage && (
                            <div className="mb-6 text-sm text-emerald-600 bg-emerald-50 border border-emerald-100 rounded-lg px-3 py-2">
                                {successMessage}
                            </div>
                        )}

                        {!isRegistering ? (
                            <>
                                {/* Login Form */}
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

                                <form onSubmit={handleLoginSubmit} className="space-y-4">
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

                                <div className="mt-6 pt-4 border-t border-zinc-100">
                                    <p className="text-xs text-zinc-400 text-center mb-2">Need a new admin account?</p>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        className="w-full"
                                        onClick={() => {
                                            setIsRegistering(true);
                                            setError("");
                                            setSuccessMessage("");
                                        }}
                                    >
                                        Register Admin
                                    </Button>
                                </div>
                            </>
                        ) : (
                            <>
                                {/* Registration Form */}
                                <form onSubmit={handleRegisterSubmit} className="space-y-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="reg-username">Full Name</Label>
                                        <Input
                                            id="reg-username"
                                            name="username"
                                            type="text"
                                            placeholder="Admin Name"
                                            required
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="reg-email">Email</Label>
                                        <Input
                                            id="reg-email"
                                            name="email"
                                            type="email"
                                            placeholder="admin@spms.com"
                                            required
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="reg-password">Password</Label>
                                        <Input
                                            id="reg-password"
                                            name="password"
                                            type="password"
                                            placeholder="••••••••"
                                            required
                                            minLength={6}
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="reg-confirmPassword">Confirm Password</Label>
                                        <Input
                                            id="reg-confirmPassword"
                                            name="confirmPassword"
                                            type="password"
                                            placeholder="••••••••"
                                            required
                                            minLength={6}
                                        />
                                    </div>

                                    {error && (
                                        <div className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2 mt-2">
                                            {error}
                                        </div>
                                    )}

                                    <div className="flex gap-2 pt-2">
                                        <Button
                                            type="button"
                                            variant="outline"
                                            className="w-1/3"
                                            onClick={() => {
                                                setIsRegistering(false);
                                                setError("");
                                            }}
                                            disabled={loading}
                                        >
                                            Cancel
                                        </Button>
                                        <Button type="submit" className="w-2/3" disabled={loading}>
                                            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                            {loading ? "Registering..." : "Create Account"}
                                        </Button>
                                    </div>
                                </form>
                            </>
                        )}
                    </CardContent>
                </Card>

                <p className="text-xs text-zinc-400 text-center mt-6">
                    Nexora — Smart Management for Smarter Campuses.
                </p>
            </div>
        </div>
    );
}
