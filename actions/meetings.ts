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

    let roleWhere: any = { projectgroup: { admin_id: session.adminId } };

    if (session.role === "faculty" && session.staffId) {
        roleWhere.guidestaffid = session.staffId;
    } else if (session.role === "student" && session.studentId) {
        const membership = await prisma.projectgroupmember.findFirst({
            where: { studentid: session.studentId },
        });
        if (membership) {
            roleWhere.projectgroupid = membership.projectgroupid;
        } else {
            return [];
        }
    } else if (session.role !== "admin") {
        return [];
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

    if (!meeting || meeting.projectgroup.admin_id !== session.adminId) return null;

    // Verify access
    if (session.role === "faculty") {
        if (meeting.guidestaffid !== session.staffId) {
            throw new Error("Unauthorized: not your meeting");
        }
    } else if (session.role === "student") {
        if (session.studentId) {
            const isMember = meeting.projectgroup.projectgroupmember.some(
                (m) => m.studentid === session.studentId
            );
            if (!isMember) {
                throw new Error("Unauthorized: not your group's meeting");
            }
        } else {
            throw new Error("Unauthorized");
        }
    }

    return meeting;
}

export async function getMeetingsByGroup(groupId: number) {
    const session = await getSession();
    if (!session) return [];

    return prisma.projectmeeting.findMany({
        where: { 
            projectgroupid: groupId,
            projectgroup: { admin_id: session.adminId }
        },
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

    const group = await prisma.projectgroup.findUnique({
        where: { projectgroupid: parsed.data.projectgroupid },
    });
    
    if (!group || group.admin_id !== session.adminId) {
        return { success: false, message: "Group not found or unauthorized" };
    }

    if (session.role === "faculty" && group.guidestaffid !== session.staffId) {
        return { success: false, message: "You can only create meetings for your assigned groups" };
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
        const meeting = await prisma.projectmeeting.findUnique({ 
            where: { projectmeetingid: id },
            include: { projectgroup: true }
        });
        if (!meeting || meeting.projectgroup.admin_id !== session.adminId) {
            return { success: false, message: "Meeting not found or unauthorized" };
        }
        if (session.role === "faculty" && meeting.projectgroup.guidestaffid !== session.staffId) {
            return { success: false, message: "Unauthorized to update this meeting" };
        }

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
        const meeting = await prisma.projectmeeting.findUnique({ 
            where: { projectmeetingid: id },
            include: { projectgroup: true }
        });
        if (!meeting || meeting.projectgroup.admin_id !== session.adminId) {
            return { success: false, message: "Meeting not found or unauthorized" };
        }
        if (session.role === "faculty" && meeting.projectgroup.guidestaffid !== session.staffId) {
            return { success: false, message: "Unauthorized to delete this meeting" };
        }

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
        const meeting = await prisma.projectmeeting.findUnique({ 
            where: { projectmeetingid: meetingId },
            include: { projectgroup: true }
        });
        if (!meeting || meeting.projectgroup.admin_id !== session.adminId) {
            return { success: false, message: "Meeting not found or unauthorized" };
        }
        if (session.role === "faculty" && meeting.projectgroup.guidestaffid !== session.staffId) {
            return { success: false, message: "Unauthorized to save attendance for this meeting" };
        }

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
