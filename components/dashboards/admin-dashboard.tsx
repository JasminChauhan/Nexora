import { prisma } from "@/lib/prisma";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
    Users,
    UserCog,
    FolderKanban,
    Calendar,
    UsersRound,
    ArrowUpRight,
    Clock,
} from "lucide-react";
import Link from "next/link";

export async function AdminDashboard({ username }: { username: string }) {
    const [
        studentCount,
        staffCount,
        projectGroupCount,
        meetingCount,
        projectTypeCount,
        pendingGroups,
        upcomingMeetings,
        recentGroups,
    ] = await Promise.all([
        prisma.student.count(),
        prisma.staff.count(),
        prisma.projectgroup.count(),
        prisma.projectmeeting.count(),
        prisma.projecttype.count(),
        prisma.projectgroup.count({ where: { status: "pending" } }),
        prisma.projectmeeting.findMany({
            where: {
                meetingdatetime: { gte: new Date() },
                meetingstatus: "Scheduled",
            },
            orderBy: { meetingdatetime: "asc" },
            take: 5,
            include: {
                projectgroup: { select: { projectgroupname: true } },
                staff: { select: { staffname: true } },
            },
        }),
        prisma.projectgroup.findMany({
            orderBy: { created: "desc" },
            take: 5,
            include: {
                projecttype: true,
                staff_projectgroup_guidestaffidTostaff: true,
                _count: { select: { projectgroupmember: true } },
            },
        }),
    ]);

    const stats = [
        {
            title: "Total Students",
            value: studentCount,
            icon: Users,
            href: "/dashboard/students",
            color: "text-blue-600",
            bgColor: "bg-blue-50",
        },
        {
            title: "Total Staff",
            value: staffCount,
            icon: UserCog,
            href: "/dashboard/staff",
            color: "text-purple-600",
            bgColor: "bg-purple-50",
        },
        {
            title: "Project Groups",
            value: projectGroupCount,
            icon: UsersRound,
            href: "/dashboard/project-groups",
            color: "text-emerald-600",
            bgColor: "bg-emerald-50",
        },
        {
            title: "Total Meetings",
            value: meetingCount,
            icon: Calendar,
            href: "/dashboard/meetings",
            color: "text-amber-600",
            bgColor: "bg-amber-50",
        },
        {
            title: "Project Types",
            value: projectTypeCount,
            icon: FolderKanban,
            href: "/dashboard/project-types",
            color: "text-rose-600",
            bgColor: "bg-rose-50",
        },
        {
            title: "Pending Approvals",
            value: pendingGroups,
            icon: Clock,
            href: "/dashboard/project-groups",
            color: "text-orange-600",
            bgColor: "bg-orange-50",
        },
    ];

    return (
        <div className="space-y-8">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-bold text-zinc-900 tracking-tight">
                    Welcome back, {username}
                </h1>
                <p className="text-zinc-500 mt-1">
                    Here&apos;s an overview of your project management system
                </p>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {stats.map((stat) => {
                    const Icon = stat.icon;
                    return (
                        <Link key={stat.title} href={stat.href}>
                            <Card className="hover:shadow-md hover:border-zinc-300 transition-all duration-200 cursor-pointer group">
                                <CardContent className="p-5">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="text-sm text-zinc-500 font-medium">{stat.title}</p>
                                            <p className="text-3xl font-bold text-zinc-900 mt-1">{stat.value}</p>
                                        </div>
                                        <div
                                            className={`w-12 h-12 rounded-xl ${stat.bgColor} flex items-center justify-center group-hover:scale-110 transition-transform duration-200`}
                                        >
                                            <Icon className={`w-6 h-6 ${stat.color}`} />
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </Link>
                    );
                })}
            </div>

            {/* Two column layout */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Upcoming Meetings */}
                <Card>
                    <CardHeader className="pb-3">
                        <div className="flex items-center justify-between">
                            <div>
                                <CardTitle className="text-base">Upcoming Meetings</CardTitle>
                                <CardDescription>Scheduled meetings</CardDescription>
                            </div>
                            <Link
                                href="/dashboard/meetings"
                                className="text-sm text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1"
                            >
                                View all
                                <ArrowUpRight className="w-3.5 h-3.5" />
                            </Link>
                        </div>
                    </CardHeader>
                    <CardContent>
                        {upcomingMeetings.length === 0 ? (
                            <p className="text-sm text-zinc-400 text-center py-6">No upcoming meetings</p>
                        ) : (
                            <div className="space-y-3">
                                {upcomingMeetings.map((meeting) => (
                                    <div
                                        key={meeting.projectmeetingid}
                                        className="flex items-center justify-between p-3 rounded-lg bg-zinc-50/80 hover:bg-zinc-100/80 transition-colors"
                                    >
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-medium text-zinc-900 truncate">
                                                {meeting.meetingpurpose}
                                            </p>
                                            <p className="text-xs text-zinc-500 mt-0.5">
                                                {meeting.projectgroup.projectgroupname}
                                                {meeting.staff && ` • ${meeting.staff.staffname}`}
                                            </p>
                                        </div>
                                        <div className="text-right shrink-0 ml-3">
                                            <p className="text-xs font-medium text-zinc-700">
                                                {new Date(meeting.meetingdatetime).toLocaleDateString("en-IN", {
                                                    day: "numeric",
                                                    month: "short",
                                                })}
                                            </p>
                                            <p className="text-xs text-zinc-500">
                                                {new Date(meeting.meetingdatetime).toLocaleTimeString("en-IN", {
                                                    hour: "2-digit",
                                                    minute: "2-digit",
                                                })}
                                            </p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Recent Project Groups */}
                <Card>
                    <CardHeader className="pb-3">
                        <div className="flex items-center justify-between">
                            <div>
                                <CardTitle className="text-base">Recent Projects</CardTitle>
                                <CardDescription>Latest project groups</CardDescription>
                            </div>
                            <Link
                                href="/dashboard/project-groups"
                                className="text-sm text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1"
                            >
                                View all
                                <ArrowUpRight className="w-3.5 h-3.5" />
                            </Link>
                        </div>
                    </CardHeader>
                    <CardContent>
                        {recentGroups.length === 0 ? (
                            <p className="text-sm text-zinc-400 text-center py-6">No project groups yet</p>
                        ) : (
                            <div className="space-y-3">
                                {recentGroups.map((group) => (
                                    <div
                                        key={group.projectgroupid}
                                        className="flex items-center justify-between p-3 rounded-lg bg-zinc-50/80 hover:bg-zinc-100/80 transition-colors"
                                    >
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-medium text-zinc-900 truncate">
                                                {group.projecttitle}
                                            </p>
                                            <p className="text-xs text-zinc-500 mt-0.5">
                                                {group.projectgroupname}
                                                {group.staff_projectgroup_guidestaffidTostaff &&
                                                    ` • Guide: ${group.staff_projectgroup_guidestaffidTostaff.staffname}`}
                                            </p>
                                        </div>
                                        <div className="flex items-center gap-2 shrink-0 ml-3">
                                            <Badge
                                                variant={
                                                    group.status === "approved"
                                                        ? "success"
                                                        : group.status === "rejected"
                                                            ? "destructive"
                                                            : "warning"
                                                }
                                            >
                                                {group.status || "pending"}
                                            </Badge>
                                            <span className="text-xs text-zinc-500">
                                                {group._count.projectgroupmember} members
                                            </span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
