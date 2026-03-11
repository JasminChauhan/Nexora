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
    ClipboardCheck,
    Calendar,
    Users,
} from "lucide-react";

export default async function AttendancePage() {
    const session = await getSession();
    if (!session || session.role !== "faculty") {
        redirect("/dashboard");
    }

    // Find the staff record for this faculty
    const staffRecord = await prisma.staff.findFirst({
        where: { email: session.email },
    });

    if (!staffRecord) {
        return (
            <div className="space-y-6">
                <div>
                    <h1 className="text-2xl font-bold text-zinc-900 tracking-tight">Attendance</h1>
                    <p className="text-zinc-500 text-sm mt-1">Meeting attendance records</p>
                </div>
                <Card className="border-amber-200 bg-amber-50/50">
                    <CardContent className="p-6">
                        <p className="font-medium text-amber-900">Staff record not found</p>
                        <p className="text-sm text-amber-700 mt-0.5">Contact your administrator.</p>
                    </CardContent>
                </Card>
            </div>
        );
    }

    // Get all completed meetings for this faculty's groups
    const meetings = await prisma.projectmeeting.findMany({
        where: {
            guidestaffid: staffRecord.staffid,
            meetingstatus: "Completed",
        },
        orderBy: { meetingdatetime: "desc" },
        include: {
            projectgroup: {
                select: { projectgroupname: true, projecttitle: true },
            },
            projectmeetingattendance: {
                include: { student: true },
            },
        },
    });

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-zinc-900 tracking-tight">Attendance</h1>
                <p className="text-zinc-500 text-sm mt-1">Meeting attendance records for your groups</p>
            </div>

            {meetings.length === 0 ? (
                <Card>
                    <CardContent className="p-12">
                        <div className="flex flex-col items-center text-center">
                            <div className="w-16 h-16 rounded-2xl bg-zinc-100 flex items-center justify-center mb-4">
                                <ClipboardCheck className="w-8 h-8 text-zinc-400" />
                            </div>
                            <p className="font-medium text-zinc-900">No Attendance Records</p>
                            <p className="text-sm text-zinc-500 mt-1">
                                Attendance records will appear here after meetings are completed.
                            </p>
                        </div>
                    </CardContent>
                </Card>
            ) : (
                <div className="space-y-4">
                    {meetings.map((meeting) => {
                        const total = meeting.projectmeetingattendance.length;
                        const present = meeting.projectmeetingattendance.filter(
                            (a) => a.ispresent === 1
                        ).length;
                        const absent = total - present;

                        return (
                            <Card key={meeting.projectmeetingid}>
                                <CardHeader className="pb-3">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <CardTitle className="text-base flex items-center gap-2">
                                                <Calendar className="w-4 h-4" />
                                                {meeting.meetingpurpose}
                                            </CardTitle>
                                            <CardDescription>
                                                {meeting.projectgroup.projectgroupname} •{" "}
                                                {new Date(meeting.meetingdatetime).toLocaleDateString("en-IN", {
                                                    day: "numeric",
                                                    month: "short",
                                                    year: "numeric",
                                                })}
                                            </CardDescription>
                                        </div>
                                        <div className="flex items-center gap-2 text-sm">
                                            <span className="text-emerald-600 font-medium">{present} present</span>
                                            <span className="text-zinc-400">/</span>
                                            <span className="text-red-600 font-medium">{absent} absent</span>
                                        </div>
                                    </div>
                                </CardHeader>
                                {total > 0 && (
                                    <CardContent>
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                            {meeting.projectmeetingattendance.map((record) => (
                                                <div
                                                    key={record.projectmeetingattendanceid}
                                                    className="flex items-center justify-between p-2.5 rounded-lg bg-zinc-50/80"
                                                >
                                                    <div className="flex items-center gap-2">
                                                        <div className="w-6 h-6 rounded-full bg-gradient-to-br from-zinc-600 to-zinc-800 flex items-center justify-center text-white text-[10px] font-medium">
                                                            {record.student.studentname.charAt(0).toUpperCase()}
                                                        </div>
                                                        <span className="text-sm text-zinc-900">
                                                            {record.student.studentname}
                                                        </span>
                                                    </div>
                                                    <Badge
                                                        variant={record.ispresent === 1 ? "success" : "destructive"}
                                                        className="text-[10px]"
                                                    >
                                                        {record.ispresent === 1 ? "Present" : "Absent"}
                                                    </Badge>
                                                </div>
                                            ))}
                                        </div>
                                        {meeting.meetingnotes && (
                                            <div className="mt-3 p-3 rounded-lg bg-zinc-50 border border-zinc-100">
                                                <p className="text-xs text-zinc-500">Meeting Notes</p>
                                                <p className="text-sm mt-0.5">{meeting.meetingnotes}</p>
                                            </div>
                                        )}
                                    </CardContent>
                                )}
                            </Card>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
