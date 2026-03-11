"use server";

import { prisma } from "@/lib/prisma";
import { meetingSchema, meetingEntrySchema } from "@/lib/validations";
import { getSession } from "@/lib/auth";
import { requireAdminOrFaculty } from "@/lib/roles";
import type { ActionResponse } from "@/types";
import { revalidatePath } from "next/cache";

/**
 * Get meetings scoped by role:
 * - Admin: all meetings
 * - Faculty: only meetings for their groups
 * - Student: only meetings for their group
 */
export async function getMeetings(search?: string) {
    const session = await getSession();
    if (!session) throw new Error("Unauthorized");

    const searchWhere = search
        ? {
            OR: [
                { meetingpurpose: { contains: search, mode: "insensitive" as const } },
                { meetinglocation: { contains: search, mode: "insensitive" as const } },
            ],
        }
        : undefined;

    let roleWhere = {};

    if (session.role === "faculty") {
        const staffRecord = await prisma.staff.findFirst({
            where: { email: session.email },
        });
        if (staffRecord) {
            roleWhere = { guidestaffid: staffRecord.staffid };
        } else {
            return [];
        }
    } else if (session.role === "student") {
        const studentRecord = await prisma.student.findFirst({
            where: { email: session.email },
        });
        if (studentRecord) {
            const membership = await prisma.projectgroupmember.findFirst({
                where: { studentid: studentRecord.studentid },
            });
            if (membership) {
                roleWhere = { projectgroupid: membership.projectgroupid };
            } else {
                return [];
            }
        } else {
            return [];
        }
    }

    return prisma.projectmeeting.findMany({
        where: {
            ...searchWhere,
            ...roleWhere,
        },
        orderBy: { meetingdatetime: "desc" },
        include: {
            projectgroup: {
                select: {
                    projectgroupname: true,
                    projecttitle: true,
                },
            },
            staff: {
                select: { staffname: true },
            },
            _count: {
                select: { projectmeetingattendance: true },
            },
        },
    });
}

export async function getMeetingById(id: number) {
    const session = await getSession();
    if (!session) throw new Error("Unauthorized");

    const meeting = await prisma.projectmeeting.findUnique({
        where: { projectmeetingid: id },
        include: {
            projectgroup: {
                include: {
                    projectgroupmember: {
                        include: { student: true },
                    },
                },
            },
            staff: true,
            projectmeetingattendance: {
                include: { student: true },
            },
        },
    });

    if (!meeting) return null;

    // Verify access
    if (session.role === "faculty") {
        const staffRecord = await prisma.staff.findFirst({
            where: { email: session.email },
        });
        if (!staffRecord || meeting.guidestaffid !== staffRecord.staffid) {
            throw new Error("Unauthorized: not your meeting");
        }
    } else if (session.role === "student") {
        const studentRecord = await prisma.student.findFirst({
            where: { email: session.email },
        });
        if (studentRecord) {
            const isMember = meeting.projectgroup.projectgroupmember.some(
                (m) => m.studentid === studentRecord.studentid
            );
            if (!isMember) {
                throw new Error("Unauthorized: not your group's meeting");
            }
        }
    }

    return meeting;
}

export async function getMeetingsByGroup(groupId: number) {
    return prisma.projectmeeting.findMany({
        where: { projectgroupid: groupId },
        orderBy: { meetingdatetime: "desc" },
        include: {
            staff: { select: { staffname: true } },
            projectmeetingattendance: {
                include: { student: true },
            },
        },
    });
}

export async function createMeeting(formData: FormData): Promise<ActionResponse> {
    const session = await getSession();
    if (!session) return { success: false, message: "Unauthorized" };
    try { requireAdminOrFaculty(session.role); } catch { return { success: false, message: "Admin or Faculty access required" }; }

    const raw = {
        projectgroupid: formData.get("projectgroupid") as string,
        guidestaffid: formData.get("guidestaffid") as string || null,
        meetingdatetime: formData.get("meetingdatetime") as string,
        meetingpurpose: formData.get("meetingpurpose") as string,
        meetinglocation: formData.get("meetinglocation") as string,
        description: formData.get("description") as string,
    };

    const parsed = meetingSchema.safeParse(raw);
    if (!parsed.success) {
        return {
            success: false,
            message: "Validation failed",
            errors: parsed.error.flatten().fieldErrors,
        };
    }

    // Faculty can only create meetings for their own groups
    if (session.role === "faculty") {
        const staffRecord = await prisma.staff.findFirst({
            where: { email: session.email },
        });
        const group = await prisma.projectgroup.findUnique({
            where: { projectgroupid: parsed.data.projectgroupid },
        });
        if (!staffRecord || !group || group.guidestaffid !== staffRecord.staffid) {
            return { success: false, message: "You can only create meetings for your assigned groups" };
        }
    }

    try {
        await prisma.projectmeeting.create({
            data: {
                projectgroupid: parsed.data.projectgroupid,
                guidestaffid: parsed.data.guidestaffid || null,
                meetingdatetime: new Date(parsed.data.meetingdatetime),
                meetingpurpose: parsed.data.meetingpurpose,
                meetinglocation: parsed.data.meetinglocation || null,
                meetingstatus: "Scheduled",
                description: parsed.data.description || null,
            },
        });

        revalidatePath("/dashboard/meetings");
        return { success: true, message: "Meeting scheduled successfully" };
    } catch (error) {
        console.error("Create meeting error:", error);
        return { success: false, message: "Failed to schedule meeting" };
    }
}

export async function updateMeetingEntry(id: number, formData: FormData): Promise<ActionResponse> {
    const session = await getSession();
    if (!session) return { success: false, message: "Unauthorized" };
    try { requireAdminOrFaculty(session.role); } catch { return { success: false, message: "Admin or Faculty access required" }; }

    const raw = {
        meetingnotes: formData.get("meetingnotes") as string,
        meetingstatus: formData.get("meetingstatus") as string,
        meetingstatusdescription: formData.get("meetingstatusdescription") as string,
    };

    const parsed = meetingEntrySchema.safeParse(raw);
    if (!parsed.success) {
        return {
            success: false,
            message: "Validation failed",
            errors: parsed.error.flatten().fieldErrors,
        };
    }

    try {
        await prisma.projectmeeting.update({
            where: { projectmeetingid: id },
            data: {
                meetingnotes: parsed.data.meetingnotes || null,
                meetingstatus: parsed.data.meetingstatus,
                meetingstatusdescription: parsed.data.meetingstatusdescription || null,
                meetingstatusdatetime: new Date(),
                modified: new Date(),
            },
        });

        revalidatePath("/dashboard/meetings");
        return { success: true, message: "Meeting updated successfully" };
    } catch (error) {
        console.error("Update meeting error:", error);
        return { success: false, message: "Failed to update meeting" };
    }
}

export async function deleteMeeting(id: number): Promise<ActionResponse> {
    const session = await getSession();
    if (!session) return { success: false, message: "Unauthorized" };
    try { requireAdminOrFaculty(session.role); } catch { return { success: false, message: "Admin or Faculty access required" }; }

    try {
        await prisma.projectmeeting.delete({ where: { projectmeetingid: id } });
        revalidatePath("/dashboard/meetings");
        return { success: true, message: "Meeting deleted successfully" };
    } catch (error) {
        console.error("Delete meeting error:", error);
        return { success: false, message: "Failed to delete meeting" };
    }
}

// Attendance actions — Admin or Faculty
export async function saveAttendance(
    meetingId: number,
    attendance: { studentid: number; ispresent: number; attendanceremarks?: string }[]
): Promise<ActionResponse> {
    const session = await getSession();
    if (!session) return { success: false, message: "Unauthorized" };
    try { requireAdminOrFaculty(session.role); } catch { return { success: false, message: "Admin or Faculty access required" }; }

    try {
        await prisma.projectmeetingattendance.deleteMany({
            where: { projectmeetingid: meetingId },
        });

        await prisma.projectmeetingattendance.createMany({
            data: attendance.map((a) => ({
                projectmeetingid: meetingId,
                studentid: a.studentid,
                ispresent: a.ispresent,
                attendanceremarks: a.attendanceremarks || null,
            })),
        });

        revalidatePath("/dashboard/meetings");
        return { success: true, message: "Attendance saved successfully" };
    } catch (error) {
        console.error("Save attendance error:", error);
        return { success: false, message: "Failed to save attendance" };
    }
}
