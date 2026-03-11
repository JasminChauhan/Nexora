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
    Calendar,
    ArrowUpRight,
    Clock,
    Users,
    BookOpen,
    UserCog,
    ClipboardCheck,
    FolderKanban,
} from "lucide-react";
import Link from "next/link";

interface StudentDashboardProps {
    username: string;
    userEmail: string;
}

export async function StudentDashboard({ username, userEmail }: StudentDashboardProps) {
    // Find the student record for this user
    const studentRecord = await prisma.student.findFirst({
        where: { email: userEmail },
    });

    const studentId = studentRecord?.studentid;

    // Find the student's project group membership
    const groupMembership = studentId
        ? await prisma.projectgroupmember.findFirst({
            where: { studentid: studentId },
            include: {
                projectgroup: {
                    include: {
                        projecttype: true,
                        staff_projectgroup_guidestaffidTostaff: true,
                        staff_projectgroup_convenerstaffidTostaff: true,
                        staff_projectgroup_expertstaffidTostaff: true,
                        projectgroupmember: {
                            include: { student: true },
                            orderBy: { isgroupleader: "desc" },
                        },
                        _count: {
                            select: { projectmeeting: true, projectgroupmember: true },
                        },
                    },
                },
            },
        })
        : null;

    const projectGroup = groupMembership?.projectgroup || null;

    // Fetch meetings and attendance for this group
    const [upcomingMeetings, meetingHistory, attendanceRecords] = await Promise.all([
        projectGroup
            ? prisma.projectmeeting.findMany({
                where: {
                    projectgroupid: projectGroup.projectgroupid,
                    meetingdatetime: { gte: new Date() },
                    meetingstatus: "Scheduled",
                },
                orderBy: { meetingdatetime: "asc" },
                take: 5,
                include: {
                    staff: { select: { staffname: true } },
                },
            })
            : [],
        projectGroup
            ? prisma.projectmeeting.findMany({
                where: {
                    projectgroupid: projectGroup.projectgroupid,
                    meetingstatus: { in: ["Completed", "Cancelled"] },
                },
                orderBy: { meetingdatetime: "desc" },
                take: 5,
                include: {
                    staff: { select: { staffname: true } },
                },
            })
            : [],
        studentId
            ? prisma.projectmeetingattendance.findMany({
                where: { studentid: studentId },
                include: {
                    projectmeeting: {
                        select: {
                            meetingpurpose: true,
                            meetingdatetime: true,
                            projectgroup: { select: { projectgroupname: true } },
                        },
                    },
                },
                orderBy: { projectmeeting: { meetingdatetime: "desc" } },
                take: 10,
            })
            : [],
    ]);

    const totalMeetings = attendanceRecords.length;
    const presentCount = attendanceRecords.filter((a) => a.ispresent === 1).length;
    const attendancePercent = totalMeetings > 0
        ? Math.round((presentCount / totalMeetings) * 100)
        : 0;

    return (
        <div className="space-y-8">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-bold text-zinc-900 tracking-tight">
                    Welcome back, {username}
                </h1>
                <p className="text-zinc-500 mt-1">
                    Here&apos;s your project overview and upcoming activities
                </p>
            </div>

            {/* No group assigned */}
            {!projectGroup && (
                <Card className="border-amber-200 bg-amber-50/50">
                    <CardContent className="p-6">
                        <div className="flex items-center gap-3">
                            <FolderKanban className="w-8 h-8 text-amber-600" />
                            <div>
                                <p className="font-medium text-amber-900">No Project Group Assigned</p>
                                <p className="text-sm text-amber-700 mt-0.5">
                                    You have not been assigned to a project group yet. Contact your administrator.
                                </p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Stats */}
            {projectGroup && (
                <>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                        <Card className="hover:shadow-md transition-all duration-200">
                            <CardContent className="p-5">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm text-zinc-500 font-medium">Group Members</p>
                                        <p className="text-3xl font-bold text-zinc-900 mt-1">
                                            {projectGroup._count.projectgroupmember}
                                        </p>
                                    </div>
                                    <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center">
                                        <Users className="w-6 h-6 text-blue-600" />
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="hover:shadow-md transition-all duration-200">
                            <CardContent className="p-5">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm text-zinc-500 font-medium">Upcoming Meetings</p>
                                        <p className="text-3xl font-bold text-zinc-900 mt-1">
                                            {upcomingMeetings.length}
                                        </p>
                                    </div>
                                    <div className="w-12 h-12 rounded-xl bg-amber-50 flex items-center justify-center">
                                        <Clock className="w-6 h-6 text-amber-600" />
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="hover:shadow-md transition-all duration-200">
                            <CardContent className="p-5">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm text-zinc-500 font-medium">Total Meetings</p>
                                        <p className="text-3xl font-bold text-zinc-900 mt-1">
                                            {projectGroup._count.projectmeeting}
                                        </p>
                                    </div>
                                    <div className="w-12 h-12 rounded-xl bg-purple-50 flex items-center justify-center">
                                        <Calendar className="w-6 h-6 text-purple-600" />
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="hover:shadow-md transition-all duration-200">
                            <CardContent className="p-5">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm text-zinc-500 font-medium">Attendance</p>
                                        <p className="text-3xl font-bold text-zinc-900 mt-1">
                                            {attendancePercent}%
                                        </p>
                                    </div>
                                    <div className="w-12 h-12 rounded-xl bg-emerald-50 flex items-center justify-center">
                                        <ClipboardCheck className="w-6 h-6 text-emerald-600" />
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Project Details Card */}
                    <Card>
                        <CardHeader className="pb-3">
                            <CardTitle className="text-base flex items-center gap-2">
                                <FolderKanban className="w-4 h-4" />
                                Project Details
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div className="p-4 rounded-xl bg-zinc-50 border border-zinc-100">
                                    <p className="text-xs text-zinc-500">Project Title</p>
                                    <p className="text-sm font-medium mt-0.5">{projectGroup.projecttitle}</p>
                                </div>
                                <div className="p-4 rounded-xl bg-zinc-50 border border-zinc-100">
                                    <p className="text-xs text-zinc-500">Group Name</p>
                                    <p className="text-sm font-medium mt-0.5">{projectGroup.projectgroupname}</p>
                                </div>
                                {projectGroup.projecttype && (
                                    <div className="p-4 rounded-xl bg-zinc-50 border border-zinc-100">
                                        <p className="text-xs text-zinc-500">Project Type</p>
                                        <p className="text-sm font-medium mt-0.5">
                                            {projectGroup.projecttype.projecttypename}
                                        </p>
                                    </div>
                                )}
                                {projectGroup.projectarea && (
                                    <div className="p-4 rounded-xl bg-zinc-50 border border-zinc-100">
                                        <p className="text-xs text-zinc-500">Project Area</p>
                                        <p className="text-sm font-medium mt-0.5">{projectGroup.projectarea}</p>
                                    </div>
                                )}
                                <div className="p-4 rounded-xl bg-zinc-50 border border-zinc-100">
                                    <p className="text-xs text-zinc-500">Status</p>
                                    <Badge
                                        className="mt-1"
                                        variant={
                                            projectGroup.status === "approved"
                                                ? "success"
                                                : projectGroup.status === "rejected"
                                                    ? "destructive"
                                                    : "warning"
                                        }
                                    >
                                        {projectGroup.status || "pending"}
                                    </Badge>
                                </div>
                                {projectGroup.staff_projectgroup_guidestaffidTostaff && (
                                    <div className="p-4 rounded-xl bg-zinc-50 border border-zinc-100">
                                        <p className="text-xs text-zinc-500 flex items-center gap-1">
                                            <UserCog className="w-3 h-3" /> Guide
                                        </p>
                                        <p className="text-sm font-medium mt-0.5">
                                            {projectGroup.staff_projectgroup_guidestaffidTostaff.staffname}
                                        </p>
                                        {projectGroup.staff_projectgroup_guidestaffidTostaff.email && (
                                            <p className="text-xs text-zinc-500">{projectGroup.staff_projectgroup_guidestaffidTostaff.email}</p>
                                        )}
                                        {projectGroup.staff_projectgroup_guidestaffidTostaff.phone && (
                                            <p className="text-xs text-zinc-500">{projectGroup.staff_projectgroup_guidestaffidTostaff.phone}</p>
                                        )}
                                    </div>
                                )}
                            </div>
                            {projectGroup.projectdescription && (
                                <div className="mt-4 p-4 rounded-xl bg-zinc-50 border border-zinc-100">
                                    <p className="text-xs text-zinc-500">Description</p>
                                    <p className="text-sm mt-0.5">{projectGroup.projectdescription}</p>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* Upcoming Meetings */}
                        <Card>
                            <CardHeader className="pb-3">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <CardTitle className="text-base">Upcoming Meetings</CardTitle>
                                        <CardDescription>Scheduled meetings for your group</CardDescription>
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
                                                    {meeting.staff && (
                                                        <p className="text-xs text-zinc-500 mt-0.5">
                                                            Guide: {meeting.staff.staffname}
                                                        </p>
                                                    )}
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

                        {/* Group Members */}
                        <Card>
                            <CardHeader className="pb-3">
                                <CardTitle className="text-base flex items-center gap-2">
                                    <Users className="w-4 h-4" />
                                    Group Members
                                </CardTitle>
                                <CardDescription>Your project team</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-3">
                                    {projectGroup.projectgroupmember.map((member) => (
                                        <div
                                            key={member.projectgroupmemberid}
                                            className="flex items-center justify-between p-3 rounded-lg bg-zinc-50/80"
                                        >
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-zinc-600 to-zinc-800 flex items-center justify-center text-white text-xs font-medium">
                                                    {member.student.studentname.charAt(0).toUpperCase()}
                                                </div>
                                                <div>
                                                    <p className="text-sm font-medium text-zinc-900">
                                                        {member.student.studentname}
                                                    </p>
                                                    {member.student.email && (
                                                        <p className="text-xs text-zinc-500">{member.student.email}</p>
                                                    )}
                                                </div>
                                            </div>
                                            {member.isgroupleader === 1 && (
                                                <Badge variant="default">Leader</Badge>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Attendance Record */}
                    {attendanceRecords.length > 0 && (
                        <Card>
                            <CardHeader className="pb-3">
                                <div>
                                    <CardTitle className="text-base flex items-center gap-2">
                                        <BookOpen className="w-4 h-4" />
                                        Attendance Record
                                    </CardTitle>
                                    <CardDescription>
                                        {presentCount} present out of {totalMeetings} meetings ({attendancePercent}%)
                                    </CardDescription>
                                </div>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-3">
                                    {attendanceRecords.map((record) => (
                                        <div
                                            key={record.projectmeetingattendanceid}
                                            className="flex items-center justify-between p-3 rounded-lg bg-zinc-50/80"
                                        >
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-medium text-zinc-900 truncate">
                                                    {record.projectmeeting.meetingpurpose}
                                                </p>
                                                <p className="text-xs text-zinc-500 mt-0.5">
                                                    {new Date(record.projectmeeting.meetingdatetime).toLocaleDateString("en-IN", {
                                                        day: "numeric",
                                                        month: "short",
                                                        year: "numeric",
                                                    })}
                                                </p>
                                            </div>
                                            <Badge variant={record.ispresent === 1 ? "success" : "destructive"}>
                                                {record.ispresent === 1 ? "Present" : "Absent"}
                                            </Badge>
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    )}
                </>
            )}
        </div>
    );
}
