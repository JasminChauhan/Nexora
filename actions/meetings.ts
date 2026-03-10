"use server";

import { prisma } from "@/lib/prisma";
import { meetingSchema, meetingEntrySchema } from "@/lib/validations";
import type { ActionResponse } from "@/types";
import { revalidatePath } from "next/cache";

export async function getMeetings(search?: string) {
    return prisma.projectmeeting.findMany({
        where: search
            ? {
                OR: [
                    { meetingpurpose: { contains: search, mode: "insensitive" } },
                    { meetinglocation: { contains: search, mode: "insensitive" } },
                ],
            }
            : undefined,
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
    return prisma.projectmeeting.findUnique({
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
    try {
        await prisma.projectmeeting.delete({ where: { projectmeetingid: id } });
        revalidatePath("/dashboard/meetings");
        return { success: true, message: "Meeting deleted successfully" };
    } catch (error) {
        console.error("Delete meeting error:", error);
        return { success: false, message: "Failed to delete meeting" };
    }
}

// Attendance actions
export async function saveAttendance(
    meetingId: number,
    attendance: { studentid: number; ispresent: number; attendanceremarks?: string }[]
): Promise<ActionResponse> {
    try {
        // Delete existing attendance for this meeting
        await prisma.projectmeetingattendance.deleteMany({
            where: { projectmeetingid: meetingId },
        });

        // Create new attendance records
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
