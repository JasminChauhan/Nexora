"use server";

import { prisma } from "@/lib/prisma";
import { projectTypeSchema } from "@/lib/validations";
import type { ActionResponse } from "@/types";
import { revalidatePath } from "next/cache";

export async function getProjectTypes() {
    return prisma.projecttype.findMany({
        orderBy: { projecttypeid: "desc" },
        include: {
            _count: {
                select: { projectgroup: true },
            },
        },
    });
}

export async function createProjectType(formData: FormData): Promise<ActionResponse> {
    const raw = {
        projecttypename: formData.get("projecttypename") as string,
        description: formData.get("description") as string,
    };

    const parsed = projectTypeSchema.safeParse(raw);
    if (!parsed.success) {
        return {
            success: false,
            message: "Validation failed",
            errors: parsed.error.flatten().fieldErrors,
        };
    }

    try {
        await prisma.projecttype.create({ data: parsed.data });
        revalidatePath("/dashboard/project-types");
        return { success: true, message: "Project type created successfully" };
    } catch (error) {
        console.error("Create project type error:", error);
        return { success: false, message: "Failed to create project type" };
    }
}

export async function updateProjectType(id: number, formData: FormData): Promise<ActionResponse> {
    const raw = {
        projecttypename: formData.get("projecttypename") as string,
        description: formData.get("description") as string,
    };

    const parsed = projectTypeSchema.safeParse(raw);
    if (!parsed.success) {
        return {
            success: false,
            message: "Validation failed",
            errors: parsed.error.flatten().fieldErrors,
        };
    }

    try {
        await prisma.projecttype.update({
            where: { projecttypeid: id },
            data: { ...parsed.data, modified: new Date() },
        });
        revalidatePath("/dashboard/project-types");
        return { success: true, message: "Project type updated successfully" };
    } catch (error) {
        console.error("Update project type error:", error);
        return { success: false, message: "Failed to update project type" };
    }
}

export async function deleteProjectType(id: number): Promise<ActionResponse> {
    try {
        await prisma.projecttype.delete({ where: { projecttypeid: id } });
        revalidatePath("/dashboard/project-types");
        return { success: true, message: "Project type deleted successfully" };
    } catch (error) {
        console.error("Delete project type error:", error);
        return { success: false, message: "Cannot delete: project type may be in use" };
    }
}
