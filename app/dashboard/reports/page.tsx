import { prisma } from "@/lib/prisma";
import { ReportsClient } from "./client";

export default async function ReportsPage() {
    const [projectGroups, meetings, students, staff] = await Promise.all([
        prisma.projectgroup.findMany({
            include: {
                projecttype: true,
                staff_projectgroup_guidestaffidTostaff: true,
                projectgroupmember: {
                    include: { student: true },
                },
                _count: {
                    select: { projectmeeting: true, projectgroupmember: true },
                },
            },
            orderBy: { projectgroupid: "desc" },
        }),
        prisma.projectmeeting.findMany({
            include: {
                projectgroup: { select: { projectgroupname: true, projecttitle: true } },
                staff: { select: { staffname: true } },
                projectmeetingattendance: {
                    include: { student: true },
                },
            },
            orderBy: { meetingdatetime: "desc" },
        }),
        prisma.student.findMany({
            include: {
                projectgroupmember: {
                    include: {
                        projectgroup: { select: { projectgroupname: true, projecttitle: true } },
                    },
                },
            },
            orderBy: { studentname: "asc" },
        }),
        prisma.staff.findMany({
            include: {
                projectgroup_projectgroup_guidestaffidTostaff: {
                    select: { projectgroupname: true, projecttitle: true },
                },
            },
            orderBy: { staffname: "asc" },
        }),
    ]);

    return (
        <ReportsClient
            projectGroups={projectGroups}
            meetings={meetings}
            students={students}
            staff={staff}
        />
    );
}
