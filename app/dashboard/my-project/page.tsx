import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
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
    FolderKanban,
    UserCog,
    Users,
    Calendar,
    Clock,
} from "lucide-react";
import Link from "next/link";

export default async function MyProjectPage() {
    const session = await getSession();
    if (!session || session.role !== "student") {
        redirect("/dashboard");
    }

    // Find the student record
    const studentRecord = await prisma.student.findFirst({
        where: { email: session.email },
    });

    if (!studentRecord) {
        return (
            <div className="space-y-6">
                <div>
                    <h1 className="text-2xl font-bold text-zinc-900 tracking-tight">My Project</h1>
                    <p className="text-zinc-500 text-sm mt-1">Your project group details</p>
                </div>
                <Card className="border-amber-200 bg-amber-50/50">
                    <CardContent className="p-6">
                        <p className="font-medium text-amber-900">Student record not found</p>
                        <p className="text-sm text-amber-700 mt-0.5">Contact your administrator.</p>
                    </CardContent>
                </Card>
            </div>
        );
    }

    // Find the student's project group
    const membership = await prisma.projectgroupmember.findFirst({
        where: { studentid: studentRecord.studentid },
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
                    projectmeeting: {
                        include: {
                            staff: { select: { staffname: true } },
                            projectmeetingattendance: true,
                        },
                        orderBy: { meetingdatetime: "desc" },
                    },
                    _count: {
                        select: { projectmeeting: true, projectgroupmember: true },
                    },
                },
            },
        },
    });

    if (!membership) {
        return (
            <div className="space-y-6">
                <div>
                    <h1 className="text-2xl font-bold text-zinc-900 tracking-tight">My Project</h1>
                    <p className="text-zinc-500 text-sm mt-1">Your project group details</p>
                </div>
                <Card className="border-amber-200 bg-amber-50/50">
                    <CardContent className="p-6">
                        <div className="flex items-center gap-3">
                            <FolderKanban className="w-8 h-8 text-amber-600" />
                            <div>
                                <p className="font-medium text-amber-900">No Project Group Assigned</p>
                                <p className="text-sm text-amber-700 mt-0.5">Contact your administrator to be assigned to a project group.</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        );
    }

    const group = membership.projectgroup;

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-zinc-900 tracking-tight">My Project</h1>
                <p className="text-zinc-500 text-sm mt-1">Your project group details</p>
            </div>

            {/* Project Info */}
            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <div>
                            <CardTitle>{group.projecttitle}</CardTitle>
                            <CardDescription>{group.projectgroupname}</CardDescription>
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
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {group.projecttype && (
                            <div className="p-4 rounded-xl bg-zinc-50 border border-zinc-100">
                                <p className="text-xs text-zinc-500 flex items-center gap-1">
                                    <FolderKanban className="w-3 h-3" /> Project Type
                                </p>
                                <p className="text-sm font-medium mt-0.5">{group.projecttype.projecttypename}</p>
                            </div>
                        )}
                        {group.projectarea && (
                            <div className="p-4 rounded-xl bg-zinc-50 border border-zinc-100">
                                <p className="text-xs text-zinc-500">Project Area</p>
                                <p className="text-sm font-medium mt-0.5">{group.projectarea}</p>
                            </div>
                        )}
                        {group.staff_projectgroup_guidestaffidTostaff && (
                            <div className="p-4 rounded-xl bg-zinc-50 border border-zinc-100">
                                <p className="text-xs text-zinc-500 flex items-center gap-1">
                                    <UserCog className="w-3 h-3" /> Guide
                                </p>
                                <p className="text-sm font-medium mt-0.5">
                                    {group.staff_projectgroup_guidestaffidTostaff.staffname}
                                </p>
                                {group.staff_projectgroup_guidestaffidTostaff.email && (
                                    <p className="text-xs text-zinc-500">{group.staff_projectgroup_guidestaffidTostaff.email}</p>
                                )}
                                {group.staff_projectgroup_guidestaffidTostaff.phone && (
                                    <p className="text-xs text-zinc-500">{group.staff_projectgroup_guidestaffidTostaff.phone}</p>
                                )}
                            </div>
                        )}
                        {group.staff_projectgroup_convenerstaffidTostaff && (
                            <div className="p-4 rounded-xl bg-zinc-50 border border-zinc-100">
                                <p className="text-xs text-zinc-500">Convener</p>
                                <p className="text-sm font-medium mt-0.5">
                                    {group.staff_projectgroup_convenerstaffidTostaff.staffname}
                                </p>
                                {group.staff_projectgroup_convenerstaffidTostaff.email && (
                                    <p className="text-xs text-zinc-500">{group.staff_projectgroup_convenerstaffidTostaff.email}</p>
                                )}
                            </div>
                        )}
                        {group.staff_projectgroup_expertstaffidTostaff && (
                            <div className="p-4 rounded-xl bg-zinc-50 border border-zinc-100">
                                <p className="text-xs text-zinc-500">Expert</p>
                                <p className="text-sm font-medium mt-0.5">
                                    {group.staff_projectgroup_expertstaffidTostaff.staffname}
                                </p>
                                {group.staff_projectgroup_expertstaffidTostaff.email && (
                                    <p className="text-xs text-zinc-500">{group.staff_projectgroup_expertstaffidTostaff.email}</p>
                                )}
                            </div>
                        )}
                    </div>
                    {group.projectdescription && (
                        <div className="mt-4 p-4 rounded-xl bg-zinc-50 border border-zinc-100">
                            <p className="text-xs text-zinc-500">Description</p>
                            <p className="text-sm mt-0.5">{group.projectdescription}</p>
                        </div>
                    )}
                </CardContent>
            </Card>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Group Members */}
                <Card>
                    <CardHeader className="pb-3">
                        <CardTitle className="text-base flex items-center gap-2">
                            <Users className="w-4 h-4" />
                            Group Members ({group._count.projectgroupmember})
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-3">
                            {group.projectgroupmember.map((member) => (
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
                                                {member.student.studentid === studentRecord.studentid && (
                                                    <span className="text-zinc-400 ml-1">(You)</span>
                                                )}
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

                {/* Meetings */}
                <Card>
                    <CardHeader className="pb-3">
                        <div className="flex items-center justify-between">
                            <CardTitle className="text-base flex items-center gap-2">
                                <Calendar className="w-4 h-4" />
                                Meetings ({group._count.projectmeeting})
                            </CardTitle>
                            <Link
                                href="/dashboard/meetings"
                                className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                            >
                                View all →
                            </Link>
                        </div>
                    </CardHeader>
                    <CardContent>
                        {group.projectmeeting.length === 0 ? (
                            <p className="text-sm text-zinc-400 text-center py-6">No meetings yet</p>
                        ) : (
                            <div className="space-y-3">
                                {group.projectmeeting.slice(0, 5).map((meeting) => (
                                    <div
                                        key={meeting.projectmeetingid}
                                        className="p-3 rounded-lg bg-zinc-50/80 space-y-1.5"
                                    >
                                        <div className="flex items-center justify-between">
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-medium text-zinc-900 truncate">
                                                    {meeting.meetingpurpose}
                                                </p>
                                                <p className="text-xs text-zinc-500 mt-0.5">
                                                    {meeting.staff?.staffname || "—"} •{" "}
                                                    {new Date(meeting.meetingdatetime).toLocaleDateString("en-IN", {
                                                        day: "numeric",
                                                        month: "short",
                                                    })}
                                                    {meeting.meetinglocation && ` • ${meeting.meetinglocation}`}
                                                </p>
                                            </div>
                                            <Badge
                                                variant={
                                                    meeting.meetingstatus === "Completed"
                                                        ? "success"
                                                        : meeting.meetingstatus === "Cancelled"
                                                            ? "destructive"
                                                            : "warning"
                                                }
                                            >
                                                {meeting.meetingstatus || "Scheduled"}
                                            </Badge>
                                        </div>
                                        {meeting.meetingnotes && (
                                            <div className="text-xs text-zinc-600 bg-white rounded p-2 border border-zinc-100">
                                                <span className="font-medium text-zinc-500">Notes: </span>
                                                {meeting.meetingnotes}
                                            </div>
                                        )}
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
