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
    UsersRound,
    Calendar,
    ArrowUpRight,
    Clock,
    Users,
    BookOpen,
} from "lucide-react";
import Link from "next/link";

interface FacultyDashboardProps {
    username: string;
    userEmail: string;
}

export async function FacultyDashboard({ username, userEmail }: FacultyDashboardProps) {
    // Find the staff record for this faculty user
    const staffRecord = await prisma.staff.findFirst({
        where: { email: userEmail },
    });

    const staffId = staffRecord?.staffid;

    // Fetch only data related to this faculty (guide)
    const [
        assignedGroups,
        upcomingMeetings,
        meetingHistory,
    ] = await Promise.all([
        // Groups where this faculty is the guide
        staffId
            ? prisma.projectgroup.findMany({
                where: { guidestaffid: staffId },
                orderBy: { created: "desc" },
                include: {
                    projecttype: true,
                    projectgroupmember: {
                        include: { student: true },
                    },
                    _count: {
                        select: { projectmeeting: true, projectgroupmember: true },
                    },
                },
            })
            : [],
        // Upcoming meetings for this faculty's groups
        staffId
            ? prisma.projectmeeting.findMany({
                where: {
                    guidestaffid: staffId,
                    meetingdatetime: { gte: new Date() },
                    meetingstatus: "Scheduled",
                },
                orderBy: { meetingdatetime: "asc" },
                take: 5,
                include: {
                    projectgroup: { select: { projectgroupname: true, projecttitle: true } },
                },
            })
            : [],
        // Recent meeting history
        staffId
            ? prisma.projectmeeting.findMany({
                where: {
                    guidestaffid: staffId,
                    meetingstatus: { in: ["Completed", "Cancelled"] },
                },
                orderBy: { meetingdatetime: "desc" },
                take: 5,
                include: {
                    projectgroup: { select: { projectgroupname: true } },
                },
            })
            : [],
    ]);

    const totalAssigned = assignedGroups.length;
    const totalUpcoming = upcomingMeetings.length;
    const totalStudents = assignedGroups.reduce(
        (sum, g) => sum + g._count.projectgroupmember, 0
    );
    const totalMeetings = assignedGroups.reduce(
        (sum, g) => sum + g._count.projectmeeting, 0
    );

    const stats = [
        {
            title: "Assigned Projects",
            value: totalAssigned,
            icon: UsersRound,
            color: "text-blue-600",
            bgColor: "bg-blue-50",
        },
        {
            title: "Total Students",
            value: totalStudents,
            icon: Users,
            color: "text-emerald-600",
            bgColor: "bg-emerald-50",
        },
        {
            title: "Upcoming Meetings",
            value: totalUpcoming,
            icon: Clock,
            color: "text-amber-600",
            bgColor: "bg-amber-50",
        },
        {
            title: "Total Meetings",
            value: totalMeetings,
            icon: Calendar,
            color: "text-purple-600",
            bgColor: "bg-purple-50",
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
                    Here&apos;s an overview of your assigned projects and meetings
                </p>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {stats.map((stat) => {
                    const Icon = stat.icon;
                    return (
                        <Card key={stat.title} className="hover:shadow-md hover:border-zinc-300 transition-all duration-200">
                            <CardContent className="p-5">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm text-zinc-500 font-medium">{stat.title}</p>
                                        <p className="text-3xl font-bold text-zinc-900 mt-1">{stat.value}</p>
                                    </div>
                                    <div
                                        className={`w-12 h-12 rounded-xl ${stat.bgColor} flex items-center justify-center`}
                                    >
                                        <Icon className={`w-6 h-6 ${stat.color}`} />
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    );
                })}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Upcoming Meetings */}
                <Card>
                    <CardHeader className="pb-3">
                        <div className="flex items-center justify-between">
                            <div>
                                <CardTitle className="text-base">Upcoming Meetings</CardTitle>
                                <CardDescription>Your scheduled meetings</CardDescription>
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

                {/* Assigned Groups */}
                <Card>
                    <CardHeader className="pb-3">
                        <div className="flex items-center justify-between">
                            <div>
                                <CardTitle className="text-base">My Project Groups</CardTitle>
                                <CardDescription>Groups you are guiding</CardDescription>
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
                        {assignedGroups.length === 0 ? (
                            <p className="text-sm text-zinc-400 text-center py-6">No assigned project groups</p>
                        ) : (
                            <div className="space-y-3">
                                {assignedGroups.slice(0, 5).map((group) => (
                                    <div
                                        key={group.projectgroupid}
                                        className="flex items-center justify-between p-3 rounded-lg bg-zinc-50/80 hover:bg-zinc-100/80 transition-colors"
                                    >
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-medium text-zinc-900 truncate">
                                                {group.projecttitle}
                                            </p>
                                            <p className="text-xs text-zinc-500 mt-0.5">
                                                {group.projectgroupname} • {group._count.projectgroupmember} members
                                            </p>
                                        </div>
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
                                    </div>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* Meeting History */}
            {meetingHistory.length > 0 && (
                <Card>
                    <CardHeader className="pb-3">
                        <div>
                            <CardTitle className="text-base flex items-center gap-2">
                                <BookOpen className="w-4 h-4" />
                                Meeting History
                            </CardTitle>
                            <CardDescription>Recently completed or cancelled meetings</CardDescription>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-3">
                            {meetingHistory.map((meeting) => (
                                <div
                                    key={meeting.projectmeetingid}
                                    className="flex items-center justify-between p-3 rounded-lg bg-zinc-50/80"
                                >
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-medium text-zinc-900 truncate">
                                            {meeting.meetingpurpose}
                                        </p>
                                        <p className="text-xs text-zinc-500 mt-0.5">
                                            {meeting.projectgroup.projectgroupname}
                                        </p>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Badge
                                            variant={
                                                meeting.meetingstatus === "Completed" ? "success" : "destructive"
                                            }
                                        >
                                            {meeting.meetingstatus}
                                        </Badge>
                                        <span className="text-xs text-zinc-500">
                                            {new Date(meeting.meetingdatetime).toLocaleDateString("en-IN", {
                                                day: "numeric",
                                                month: "short",
                                            })}
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}
