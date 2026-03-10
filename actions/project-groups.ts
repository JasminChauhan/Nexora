"use server";

import { prisma } from "@/lib/prisma";
import { projectGroupSchema } from "@/lib/validations";
import type { ActionResponse } from "@/types";
import { revalidatePath } from "next/cache";

export async function getProjectGroups(search?: string) {
    return prisma.projectgroup.findMany({
        where: search
            ? {
                OR: [
                    { projectgroupname: { contains: search, mode: "insensitive" } },
                    { projecttitle: { contains: search, mode: "insensitive" } },
                ],
            }
            : undefined,
        orderBy: { projectgroupid: "desc" },
        include: {
            projecttype: true,
            staff_projectgroup_guidestaffidTostaff: true,
            staff_projectgroup_convenerstaffidTostaff: true,
            staff_projectgroup_expertstaffidTostaff: true,
            projectgroupmember: {
                include: { student: true },
            },
            _count: {
                select: {
                    projectmeeting: true,
                    projectgroupmember: true,
                },
            },
        },
    });
}

export async function getProjectGroupById(id: number) {
    return prisma.projectgroup.findUnique({
        where: { projectgroupid: id },
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
                    projectmeetingattendance: {
                        include: { student: true },
                    },
                    staff: true,
                },
                orderBy: { meetingdatetime: "desc" },
            },
        },
    });
}

export async function createProjectGroup(formData: FormData): Promise<ActionResponse> {
    const raw = {
        projectgroupname: formData.get("projectgroupname") as string,
        projecttypeid: formData.get("projecttypeid") as string,
        guidestaffid: formData.get("guidestaffid") as string || null,
        projecttitle: formData.get("projecttitle") as string,
        projectarea: formData.get("projectarea") as string,
        projectdescription: formData.get("projectdescription") as string,
        convenerstaffid: formData.get("convenerstaffid") as string || null,
        expertstaffid: formData.get("expertstaffid") as string || null,
        description: formData.get("description") as string,
    };

    const parsed = projectGroupSchema.safeParse(raw);
    if (!parsed.success) {
        return {
            success: false,
            message: "Validation failed",
            errors: parsed.error.flatten().fieldErrors,
        };
    }

    try {
        const guide = parsed.data.guidestaffid
            ? await prisma.staff.findUnique({ where: { staffid: parsed.data.guidestaffid } })
            : null;

        await prisma.projectgroup.create({
            data: {
                projectgroupname: parsed.data.projectgroupname,
                projecttypeid: parsed.data.projecttypeid,
                guidestaffid: parsed.data.guidestaffid || null,
                guidestaffname: guide?.staffname || null,
                projecttitle: parsed.data.projecttitle,
                projectarea: parsed.data.projectarea || null,
                projectdescription: parsed.data.projectdescription || null,
                convenerstaffid: parsed.data.convenerstaffid || null,
                expertstaffid: parsed.data.expertstaffid || null,
                description: parsed.data.description || null,
                status: "pending",
            },
        });

        revalidatePath("/dashboard/project-groups");
        return { success: true, message: "Project group created successfully" };
    } catch (error) {
        console.error("Create project group error:", error);
        return { success: false, message: "Failed to create project group" };
    }
}

export async function updateProjectGroup(id: number, formData: FormData): Promise<ActionResponse> {
    const raw = {
        projectgroupname: formData.get("projectgroupname") as string,
        projecttypeid: formData.get("projecttypeid") as string,
        guidestaffid: formData.get("guidestaffid") as string || null,
        projecttitle: formData.get("projecttitle") as string,
        projectarea: formData.get("projectarea") as string,
        projectdescription: formData.get("projectdescription") as string,
        convenerstaffid: formData.get("convenerstaffid") as string || null,
        expertstaffid: formData.get("expertstaffid") as string || null,
        description: formData.get("description") as string,
    };

    const parsed = projectGroupSchema.safeParse(raw);
    if (!parsed.success) {
        return {
            success: false,
            message: "Validation failed",
            errors: parsed.error.flatten().fieldErrors,
        };
    }

    try {
        const guide = parsed.data.guidestaffid
            ? await prisma.staff.findUnique({ where: { staffid: parsed.data.guidestaffid } })
            : null;

        await prisma.projectgroup.update({
            where: { projectgroupid: id },
            data: {
                projectgroupname: parsed.data.projectgroupname,
                projecttypeid: parsed.data.projecttypeid,
                guidestaffid: parsed.data.guidestaffid || null,
                guidestaffname: guide?.staffname || null,
                projecttitle: parsed.data.projecttitle,
                projectarea: parsed.data.projectarea || null,
                projectdescription: parsed.data.projectdescription || null,
                convenerstaffid: parsed.data.convenerstaffid || null,
                expertstaffid: parsed.data.expertstaffid || null,
                description: parsed.data.description || null,
                modified: new Date(),
            },
        });

        revalidatePath("/dashboard/project-groups");
        return { success: true, message: "Project group updated successfully" };
    } catch (error) {
        console.error("Update project group error:", error);
        return { success: false, message: "Failed to update project group" };
    }
}

export async function deleteProjectGroup(id: number): Promise<ActionResponse> {
    try {
        await prisma.projectgroup.delete({ where: { projectgroupid: id } });
        revalidatePath("/dashboard/project-groups");
        return { success: true, message: "Project group deleted successfully" };
    } catch (error) {
        console.error("Delete project group error:", error);
        return { success: false, message: "Failed to delete project group" };
    }
}

export async function updateGroupStatus(id: number, status: string): Promise<ActionResponse> {
    try {
        await prisma.projectgroup.update({
            where: { projectgroupid: id },
            data: { status, modified: new Date() },
        });
        revalidatePath("/dashboard/project-groups");
        return { success: true, message: `Project status updated to ${status}` };
    } catch (error) {
        console.error("Update status error:", error);
        return { success: false, message: "Failed to update status" };
    }
}

// Group member actions
export async function addGroupMember(
    projectgroupid: number,
    studentid: number,
    isgroupleader: number = 0,
    studentcgpa?: number
): Promise<ActionResponse> {
    try {
        await prisma.projectgroupmember.create({
            data: {
                projectgroupid,
                studentid,
                isgroupleader,
                studentcgpa: studentcgpa ?? null,
            },
        });

        // Recalculate average CPI
        await recalculateAverageCPI(projectgroupid);

        revalidatePath("/dashboard/project-groups");
        return { success: true, message: "Member added successfully" };
    } catch (error) {
        console.error("Add member error:", error);
        return { success: false, message: "Student may already be in this group" };
    }
}

export async function removeGroupMember(memberId: number): Promise<ActionResponse> {
    try {
        const member = await prisma.projectgroupmember.findUnique({
            where: { projectgroupmemberid: memberId },
        });

        await prisma.projectgroupmember.delete({
            where: { projectgroupmemberid: memberId },
        });

        if (member) {
            await recalculateAverageCPI(member.projectgroupid);
        }

        revalidatePath("/dashboard/project-groups");
        return { success: true, message: "Member removed successfully" };
    } catch (error) {
        console.error("Remove member error:", error);
        return { success: false, message: "Failed to remove member" };
    }
}

export async function setGroupLeader(memberId: number, projectgroupid: number): Promise<ActionResponse> {
    try {
        // Remove leader status from all members
        await prisma.projectgroupmember.updateMany({
            where: { projectgroupid },
            data: { isgroupleader: 0 },
        });

        // Set new leader
        await prisma.projectgroupmember.update({
            where: { projectgroupmemberid: memberId },
            data: { isgroupleader: 1 },
        });

        revalidatePath("/dashboard/project-groups");
        return { success: true, message: "Group leader updated" };
    } catch (error) {
        console.error("Set leader error:", error);
        return { success: false, message: "Failed to update group leader" };
    }
}

async function recalculateAverageCPI(projectgroupid: number) {
    const members = await prisma.projectgroupmember.findMany({
        where: { projectgroupid },
    });

    const cgpas = members

        .map((m) => Number(m.studentcgpa))
        .filter((c) => !isNaN(c) && c > 0);

    const avg = cgpas.length > 0 ? cgpas.reduce((a, b) => a + b, 0) / cgpas.length : null;

    await prisma.projectgroup.update({
        where: { projectgroupid },
        data: { averagecpi: avg },
    });
}
