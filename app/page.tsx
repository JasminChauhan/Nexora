"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
    GraduationCap,
    Users,
    CalendarCheck,
    BarChart3,
    ArrowRight,
    Shield,
    Zap,
    Globe,
    ChevronRight,
    Sparkles,
    CheckCircle2,
    Menu,
    X,
} from "lucide-react";

/* ─── Animated counter hook ──────────────────────────────────── */
function useCounter(end: number, duration = 2000) {
    const [count, setCount] = useState(0);
    const ref = useRef<HTMLDivElement>(null);
    const started = useRef(false);

    useEffect(() => {
        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting && !started.current) {
                    started.current = true;
                    const startTime = performance.now();
                    const step = (now: number) => {
                        const elapsed = now - startTime;
                        const progress = Math.min(elapsed / duration, 1);
                        const eased = 1 - Math.pow(1 - progress, 3);
                        setCount(Math.floor(eased * end));
                        if (progress < 1) requestAnimationFrame(step);
                    };
                    requestAnimationFrame(step);
                }
            },
            { threshold: 0.3 }
        );
        if (ref.current) observer.observe(ref.current);
        return () => observer.disconnect();
    }, [end, duration]);

    return { count, ref };
}

/* ─── Intersection observer for reveal animations ────────────── */
function useReveal() {
    const ref = useRef<HTMLDivElement>(null);
    const [visible, setVisible] = useState(false);

    useEffect(() => {
        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting) setVisible(true);
            },
            { threshold: 0.15 }
        );
        if (ref.current) observer.observe(ref.current);
        return () => observer.disconnect();
    }, []);

    return { ref, visible };
}

/* ─── Data ──────────────────────────────────────────────────── */
const features = [
    {
        icon: Users,
        title: "Team Management",
        description:
            "Effortlessly create and manage student groups. Assign faculty guides, track member contributions, and foster collaborative learning.",
        gradient: "from-blue-500 to-cyan-400",
    },
    {
        icon: CalendarCheck,
        title: "Smart Scheduling",
        description:
            "Streamline meetings and reviews with an intelligent scheduling system. Automated reminders keep everyone on track.",
        gradient: "from-violet-500 to-purple-400",
    },
    {
        icon: BarChart3,
        title: "Progress Tracking",
        description:
            "Visual dashboards and analytics give real-time insight into project milestones, deadlines, and overall performance.",
        gradient: "from-emerald-500 to-teal-400",
    },
    {
        icon: Shield,
        title: "Role-Based Access",
        description:
            "Admins, faculty, and students each get tailored views and permissions, ensuring the right people see the right data.",
        gradient: "from-amber-500 to-orange-400",
    },
    {
        icon: Zap,
        title: "Instant Notifications",
        description:
            "Stay informed with real-time updates on project changes, meeting schedules, and important announcements.",
        gradient: "from-rose-500 to-pink-400",
    },
    {
        icon: Globe,
        title: "Cloud-First Design",
        description:
            "Access your projects from anywhere. Fully responsive, lightning-fast, and built for today's distributed teams.",
        gradient: "from-sky-500 to-indigo-400",
    },
];

const stats = [
    { label: "Active Projects", value: 500, suffix: "+" },
    { label: "Students Managed", value: 2500, suffix: "+" },
    { label: "Faculty Members", value: 120, suffix: "+" },
    { label: "Uptime", value: 99.9, suffix: "%", decimals: 1 },
];

const steps = [
    {
        number: "01",
        title: "Create Your Account",
        description: "Sign up in seconds as an admin, faculty member, or student.",
    },
    {
        number: "02",
        title: "Set Up Projects",
        description: "Define project groups, assign guides, and set milestones effortlessly.",
    },
    {
        number: "03",
        title: "Track & Collaborate",
        description: "Monitor progress, schedule meetings, and keep your team aligned in real time.",
    },
];

/* ═══════════════════════════════════════════════════════════════
   LANDING PAGE
   ═══════════════════════════════════════════════════════════════ */
export default function LandingPage() {
    const [mobileNav, setMobileNav] = useState(false);
    const heroReveal = useReveal();
    const featuresReveal = useReveal();
    const stepsReveal = useReveal();
    const ctaReveal = useReveal();

    return (
        <div className="min-h-screen bg-white text-zinc-900 overflow-x-hidden">
            {/* ═══ NAV ═══ */}
            <header className="fixed top-0 inset-x-0 z-50 border-b border-zinc-200/60 bg-white/70 backdrop-blur-xl supports-[backdrop-filter]:bg-white/50">
                <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 flex items-center justify-between h-16">
                    <Link href="/" className="flex items-center gap-2.5">
                        <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-zinc-900 text-white shadow-lg shadow-zinc-900/20">
                            <GraduationCap className="w-5 h-5" />
                        </div>
                        <span className="text-lg font-bold tracking-tight bg-gradient-to-r from-zinc-900 to-zinc-600 bg-clip-text text-transparent">
                            Nexora
                        </span>
                    </Link>

                    {/* Desktop links */}
                    <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-zinc-500">
                        <a href="#features" className="hover:text-zinc-900 transition-colors">
                            Features
                        </a>
                        <a href="#how-it-works" className="hover:text-zinc-900 transition-colors">
                            How It Works
                        </a>
                        <a href="#stats" className="hover:text-zinc-900 transition-colors">
                            Stats
                        </a>
                    </nav>

                    <div className="hidden md:flex items-center gap-3">
                        <Link
                            href="/login"
                            className="text-sm font-medium text-zinc-600 hover:text-zinc-900 transition-colors px-4 py-2"
                        >
                            Sign In
                        </Link>
                        <Link
                            href="/login"
                            className="text-sm font-medium bg-zinc-900 text-white px-5 py-2.5 rounded-xl hover:bg-zinc-800 transition-all shadow-lg shadow-zinc-900/20 hover:shadow-xl hover:shadow-zinc-900/25 hover:-translate-y-0.5"
                        >
                            Get Started
                        </Link>
                    </div>

                    {/* Mobile toggle */}
                    <button
                        className="md:hidden p-2 rounded-lg hover:bg-zinc-100 transition-colors cursor-pointer"
                        onClick={() => setMobileNav(!mobileNav)}
                    >
                        {mobileNav ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
                    </button>
                </div>

                {/* Mobile nav */}
                {mobileNav && (
                    <div className="md:hidden border-t border-zinc-200/60 bg-white/95 backdrop-blur-xl">
                        <div className="px-4 py-4 space-y-3">
                            <a
                                href="#features"
                                onClick={() => setMobileNav(false)}
                                className="block text-sm font-medium text-zinc-600 hover:text-zinc-900 py-2"
                            >
                                Features
                            </a>
                            <a
                                href="#how-it-works"
                                onClick={() => setMobileNav(false)}
                                className="block text-sm font-medium text-zinc-600 hover:text-zinc-900 py-2"
                            >
                                How It Works
                            </a>
                            <a
                                href="#stats"
                                onClick={() => setMobileNav(false)}
                                className="block text-sm font-medium text-zinc-600 hover:text-zinc-900 py-2"
                            >
                                Stats
                            </a>
                            <div className="pt-2 flex flex-col gap-2">
                                <Link
                                    href="/login"
                                    className="text-center text-sm font-medium text-zinc-600 border border-zinc-200 px-4 py-2.5 rounded-xl hover:bg-zinc-50 transition-colors"
                                >
                                    Sign In
                                </Link>
                                <Link
                                    href="/login"
                                    className="text-center text-sm font-medium bg-zinc-900 text-white px-4 py-2.5 rounded-xl hover:bg-zinc-800 transition-colors"
                                >
                                    Get Started
                                </Link>
                            </div>
                        </div>
                    </div>
                )}
            </header>

            {/* ═══ HERO ═══ */}
            <section className="relative pt-32 pb-20 md:pt-44 md:pb-32 overflow-hidden">
                {/* Background decorations */}
                <div className="absolute inset-0 -z-10">
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[600px] bg-gradient-to-b from-blue-50/80 via-violet-50/50 to-transparent rounded-full blur-3xl" />
                    <div className="absolute top-20 right-0 w-72 h-72 bg-gradient-to-br from-emerald-50 to-cyan-50 rounded-full blur-3xl opacity-60" />
                    <div className="absolute bottom-0 left-0 w-96 h-96 bg-gradient-to-tr from-amber-50 to-rose-50 rounded-full blur-3xl opacity-40" />
                    <div className="absolute inset-0 bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:24px_24px] opacity-30" />
                </div>

                <div
                    ref={heroReveal.ref}
                    className={`mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center transition-all duration-1000 ${
                        heroReveal.visible
                            ? "opacity-100 translate-y-0"
                            : "opacity-0 translate-y-8"
                    }`}
                >
                    {/* Badge */}
                    <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-zinc-100 border border-zinc-200/80 text-xs font-semibold text-zinc-600 mb-6 shadow-sm">
                        <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                        Student Project Management System
                    </div>

                    <h1 className="text-4xl sm:text-5xl md:text-7xl font-extrabold tracking-tight leading-[1.1] max-w-4xl mx-auto">
                        Manage Projects{" "}
                        <span className="bg-gradient-to-r from-blue-600 via-violet-600 to-purple-600 bg-clip-text text-transparent">
                            Smarter
                        </span>
                        , Not Harder
                    </h1>

                    <p className="mt-6 text-lg md:text-xl text-zinc-500 max-w-2xl mx-auto leading-relaxed">
                        Nexora empowers universities to streamline student projects with
                        intelligent group management, effortless scheduling, and real-time
                        progress tracking — all in one platform.
                    </p>

                    <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
                        <Link
                            href="/login"
                            className="group flex items-center gap-2 bg-zinc-900 text-white px-8 py-4 rounded-2xl text-sm font-semibold hover:bg-zinc-800 transition-all shadow-xl shadow-zinc-900/20 hover:shadow-2xl hover:shadow-zinc-900/30 hover:-translate-y-0.5"
                        >
                            Get Started Free
                            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                        </Link>
                        <a
                            href="#features"
                            className="flex items-center gap-2 text-sm font-semibold text-zinc-600 px-8 py-4 rounded-2xl border border-zinc-200 hover:bg-zinc-50 hover:border-zinc-300 transition-all"
                        >
                            Explore Features
                            <ChevronRight className="w-4 h-4" />
                        </a>
                    </div>

                    {/* Hero visual mock */}
                    <div className="mt-16 md:mt-20 relative mx-auto max-w-5xl">
                        <div className="absolute -inset-4 bg-gradient-to-r from-blue-500/10 via-violet-500/10 to-emerald-500/10 rounded-3xl blur-2xl" />
                        <div className="relative bg-white border border-zinc-200/80 rounded-2xl shadow-2xl shadow-zinc-200/50 overflow-hidden">
                            {/* Mock browser bar */}
                            <div className="flex items-center gap-2 px-4 py-3 border-b border-zinc-100 bg-zinc-50/50">
                                <div className="flex gap-1.5">
                                    <div className="w-3 h-3 rounded-full bg-red-400" />
                                    <div className="w-3 h-3 rounded-full bg-amber-400" />
                                    <div className="w-3 h-3 rounded-full bg-emerald-400" />
                                </div>
                                <div className="flex-1 mx-8">
                                    <div className="bg-zinc-100 rounded-lg px-4 py-1.5 text-xs text-zinc-400 text-center max-w-xs mx-auto">
                                        nexora.edu/dashboard
                                    </div>
                                </div>
                            </div>

                            {/* Mock dashboard content */}
                            <div className="p-6 md:p-8 bg-gradient-to-br from-zinc-50 to-white">
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                                    {[
                                        { label: "Total Projects", val: "48", color: "text-blue-600", bg: "bg-blue-50" },
                                        { label: "Active Groups", val: "156", color: "text-violet-600", bg: "bg-violet-50" },
                                        { label: "Meetings Today", val: "12", color: "text-emerald-600", bg: "bg-emerald-50" },
                                        { label: "Completion", val: "78%", color: "text-amber-600", bg: "bg-amber-50" },
                                    ].map((stat) => (
                                        <div
                                            key={stat.label}
                                            className={`${stat.bg} rounded-xl p-4 border border-zinc-100`}
                                        >
                                            <p className="text-xs text-zinc-500 font-medium">{stat.label}</p>
                                            <p className={`text-2xl font-bold ${stat.color} mt-1`}>
                                                {stat.val}
                                            </p>
                                        </div>
                                    ))}
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <div className="md:col-span-2 bg-white rounded-xl border border-zinc-100 p-4 h-32 flex items-end gap-2">
                                        {[40, 65, 45, 80, 55, 90, 70, 85, 60, 95, 75, 88].map(
                                            (h, i) => (
                                                <div
                                                    key={i}
                                                    className="flex-1 bg-gradient-to-t from-blue-500 to-violet-400 rounded-t-sm opacity-80"
                                                    style={{ height: `${h}%` }}
                                                />
                                            )
                                        )}
                                    </div>
                                    <div className="bg-white rounded-xl border border-zinc-100 p-4 h-32">
                                        <div className="flex items-center gap-2 mb-3">
                                            <div className="w-2 h-2 rounded-full bg-emerald-500" />
                                            <span className="text-xs text-zinc-500 font-medium">Recent Activity</span>
                                        </div>
                                        <div className="space-y-2">
                                            {[1, 2, 3].map((i) => (
                                                <div key={i} className="flex items-center gap-2">
                                                    <div className="w-6 h-6 rounded-full bg-zinc-100" />
                                                    <div className="flex-1 h-2 bg-zinc-100 rounded-full" />
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* ═══ FEATURES ═══ */}
            <section id="features" className="py-20 md:py-32 bg-zinc-50/50">
                <div
                    ref={featuresReveal.ref}
                    className={`mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 transition-all duration-1000 ${
                        featuresReveal.visible
                            ? "opacity-100 translate-y-0"
                            : "opacity-0 translate-y-8"
                    }`}
                >
                    <div className="text-center max-w-2xl mx-auto mb-16">
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 text-xs font-semibold text-blue-600 mb-4">
                            <Zap className="w-3 h-3" />
                            Powerful Features
                        </div>
                        <h2 className="text-3xl md:text-5xl font-extrabold tracking-tight">
                            Everything You Need to{" "}
                            <span className="bg-gradient-to-r from-blue-600 to-violet-600 bg-clip-text text-transparent">
                                Succeed
                            </span>
                        </h2>
                        <p className="mt-4 text-zinc-500 text-lg">
                            Built specifically for academic project management, Nexora provides
                            the tools that students, faculty, and administrators need.
                        </p>
                    </div>

                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {features.map((feature, i) => {
                            const Icon = feature.icon;
                            return (
                                <div
                                    key={feature.title}
                                    className="group relative bg-white rounded-2xl border border-zinc-200/60 p-6 hover:shadow-xl hover:shadow-zinc-200/50 transition-all duration-300 hover:-translate-y-1"
                                    style={{
                                        transitionDelay: `${i * 80}ms`,
                                    }}
                                >
                                    <div
                                        className={`w-12 h-12 rounded-xl bg-gradient-to-br ${feature.gradient} flex items-center justify-center text-white shadow-lg mb-4`}
                                    >
                                        <Icon className="w-6 h-6" />
                                    </div>
                                    <h3 className="text-lg font-semibold text-zinc-900 mb-2">
                                        {feature.title}
                                    </h3>
                                    <p className="text-sm text-zinc-500 leading-relaxed">
                                        {feature.description}
                                    </p>
                                    <div className="absolute bottom-0 left-6 right-6 h-0.5 bg-gradient-to-r from-transparent via-zinc-200 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                                </div>
                            );
                        })}
                    </div>
                </div>
            </section>

            {/* ═══ HOW IT WORKS ═══ */}
            <section id="how-it-works" className="py-20 md:py-32">
                <div
                    ref={stepsReveal.ref}
                    className={`mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 transition-all duration-1000 ${
                        stepsReveal.visible
                            ? "opacity-100 translate-y-0"
                            : "opacity-0 translate-y-8"
                    }`}
                >
                    <div className="text-center max-w-2xl mx-auto mb-16">
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 text-xs font-semibold text-emerald-600 mb-4">
                            <CheckCircle2 className="w-3 h-3" />
                            Simple Setup
                        </div>
                        <h2 className="text-3xl md:text-5xl font-extrabold tracking-tight">
                            Up and Running in{" "}
                            <span className="bg-gradient-to-r from-emerald-600 to-teal-500 bg-clip-text text-transparent">
                                Minutes
                            </span>
                        </h2>
                        <p className="mt-4 text-zinc-500 text-lg">
                            No complicated setup. No learning curve. Just sign up and start
                            managing your projects.
                        </p>
                    </div>

                    <div className="grid md:grid-cols-3 gap-8 relative">
                        {/* Connecting line (desktop) */}
                        <div className="hidden md:block absolute top-16 left-[16.67%] right-[16.67%] h-0.5 bg-gradient-to-r from-zinc-200 via-zinc-300 to-zinc-200" />

                        {steps.map((step, i) => (
                            <div key={step.number} className="relative text-center">
                                <div
                                    className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-zinc-900 text-white text-lg font-bold mb-6 shadow-lg shadow-zinc-900/20 relative z-10"
                                    style={{ animationDelay: `${i * 200}ms` }}
                                >
                                    {step.number}
                                </div>
                                <h3 className="text-xl font-bold text-zinc-900 mb-2">
                                    {step.title}
                                </h3>
                                <p className="text-sm text-zinc-500 leading-relaxed max-w-xs mx-auto">
                                    {step.description}
                                </p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ═══ STATS ═══ */}
            <section id="stats" className="py-20 md:py-32 bg-zinc-900 text-white relative overflow-hidden">
                {/* Decorative */}
                <div className="absolute inset-0">
                    <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl" />
                    <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-violet-500/10 rounded-full blur-3xl" />
                    <div className="absolute inset-0 bg-[radial-gradient(#ffffff08_1px,transparent_1px)] [background-size:24px_24px]" />
                </div>

                <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                    <div className="text-center mb-16">
                        <h2 className="text-3xl md:text-5xl font-extrabold tracking-tight">
                            Trusted by{" "}
                            <span className="bg-gradient-to-r from-blue-400 to-violet-400 bg-clip-text text-transparent">
                                Institutions
                            </span>
                        </h2>
                        <p className="mt-4 text-zinc-400 text-lg max-w-xl mx-auto">
                            Numbers that reflect our commitment to empowering academic excellence.
                        </p>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
                        {stats.map((stat) => {
                            const counter = useCounter(
                                stat.decimals ? stat.value * 10 : stat.value
                            );
                            return (
                                <div
                                    key={stat.label}
                                    ref={counter.ref}
                                    className="text-center"
                                >
                                    <p className="text-4xl md:text-5xl font-extrabold bg-gradient-to-b from-white to-zinc-400 bg-clip-text text-transparent">
                                        {stat.decimals
                                            ? (counter.count / 10).toFixed(stat.decimals)
                                            : counter.count}
                                        {stat.suffix}
                                    </p>
                                    <p className="mt-2 text-sm text-zinc-400 font-medium">
                                        {stat.label}
                                    </p>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </section>

            {/* ═══ CTA ═══ */}
            <section className="py-20 md:py-32">
                <div
                    ref={ctaReveal.ref}
                    className={`mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 transition-all duration-1000 ${
                        ctaReveal.visible
                            ? "opacity-100 translate-y-0"
                            : "opacity-0 translate-y-8"
                    }`}
                >
                    <div className="relative bg-gradient-to-br from-zinc-900 via-zinc-800 to-zinc-900 rounded-3xl p-10 md:p-16 text-center text-white overflow-hidden shadow-2xl">
                        {/* Decorative */}
                        <div className="absolute inset-0">
                            <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/15 rounded-full blur-3xl" />
                            <div className="absolute bottom-0 left-0 w-64 h-64 bg-violet-500/15 rounded-full blur-3xl" />
                        </div>

                        <div className="relative z-10">
                            <h2 className="text-3xl md:text-5xl font-extrabold tracking-tight">
                                Ready to Transform Your
                                <br />
                                <span className="bg-gradient-to-r from-blue-400 via-violet-400 to-purple-400 bg-clip-text text-transparent">
                                    Project Management?
                                </span>
                            </h2>
                            <p className="mt-4 text-zinc-400 text-lg max-w-xl mx-auto">
                                Join institutions already using Nexora to drive student success.
                                Get started in minutes — no credit card required.
                            </p>
                            <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
                                <Link
                                    href="/login"
                                    className="group flex items-center gap-2 bg-white text-zinc-900 px-8 py-4 rounded-2xl text-sm font-semibold hover:bg-zinc-100 transition-all shadow-xl hover:-translate-y-0.5"
                                >
                                    Start Using Nexora
                                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                                </Link>
                                <a
                                    href="#features"
                                    className="text-sm font-semibold text-zinc-400 hover:text-white transition-colors px-6 py-4"
                                >
                                    Learn More →
                                </a>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* ═══ FOOTER ═══ */}
            <footer className="border-t border-zinc-200/60 py-12 bg-zinc-50/50">
                <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                    <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                        <div className="flex items-center gap-2.5">
                            <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-zinc-900 text-white">
                                <GraduationCap className="w-4 h-4" />
                            </div>
                            <span className="font-semibold tracking-tight text-zinc-900">
                                Nexora
                            </span>
                        </div>

                        <div className="flex items-center gap-6 text-sm text-zinc-500">
                            <a href="#features" className="hover:text-zinc-900 transition-colors">
                                Features
                            </a>
                            <a href="#how-it-works" className="hover:text-zinc-900 transition-colors">
                                How It Works
                            </a>
                            <a href="#stats" className="hover:text-zinc-900 transition-colors">
                                Stats
                            </a>
                            <Link href="/login" className="hover:text-zinc-900 transition-colors">
                                Sign In
                            </Link>
                        </div>

                        <p className="text-xs text-zinc-400">
                            © {new Date().getFullYear()} Nexora. All rights reserved.
                        </p>
                    </div>
                </div>
            </footer>
        </div>
    );
}
