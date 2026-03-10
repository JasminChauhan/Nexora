"use server";

import { prisma } from "@/lib/prisma";
import { staffSchema, staffUpdateSchema } from "@/lib/validations";
import { hashPassword } from "@/lib/auth";
import type { ActionResponse } from "@/types";
import { revalidatePath } from "next/cache";

export async function getStaff(search?: string) {
    return prisma.staff.findMany({
        where: search
            ? {
                OR: [
                    { staffname: { contains: search, mode: "insensitive" } },
                    { email: { contains: search, mode: "insensitive" } },
                ],
            }
            : undefined,
        orderBy: { staffid: "desc" },
    });
}

export async function getStaffById(id: number) {
    return prisma.staff.findUnique({ where: { staffid: id } });
}

export async function createStaff(formData: FormData): Promise<ActionResponse> {
    const raw = {
        staffname: formData.get("staffname") as string,
        phone: formData.get("phone") as string,
        email: formData.get("email") as string,
        password: formData.get("password") as string,
        description: formData.get("description") as string,
    };

    const parsed = staffSchema.safeParse(raw);
    if (!parsed.success) {
        return {
            success: false,
            message: "Validation failed",
            errors: parsed.error.flatten().fieldErrors,
        };
    }

    try {
        const hashedPassword = await hashPassword(parsed.data.password);

        await prisma.staff.create({
            data: {
                staffname: parsed.data.staffname,
                phone: parsed.data.phone || null,
                email: parsed.data.email || null,
                password: hashedPassword,
                description: parsed.data.description || null,
            },
        });

        // Also create a user record for faculty login
        if (parsed.data.email) {
            const existingUser = await prisma.users.findUnique({
                where: { email: parsed.data.email },
            });
            if (!existingUser) {
                await prisma.users.create({
                    data: {
                        username: parsed.data.staffname.toLowerCase().replace(/\s+/g, "_"),
                        email: parsed.data.email,
                        password_hash: hashedPassword,
                        role: "faculty",
                        is_active: true,
                    },
                });
            }
        }

        revalidatePath("/dashboard/staff");
        return { success: true, message: "Staff member created successfully" };
    } catch (error) {
        console.error("Create staff error:", error);
        return { success: false, message: "Failed to create staff member" };
    }
}

export async function updateStaff(id: number, formData: FormData): Promise<ActionResponse> {
    const raw = {
        staffname: formData.get("staffname") as string,
        phone: formData.get("phone") as string,
        email: formData.get("email") as string,
        password: formData.get("password") as string,
        description: formData.get("description") as string,
    };

    const parsed = staffUpdateSchema.safeParse(raw);
    if (!parsed.success) {
        return {
            success: false,
            message: "Validation failed",
            errors: parsed.error.flatten().fieldErrors,
        };
    }

    try {
        const updateData: Record<string, unknown> = {
            staffname: parsed.data.staffname,
            phone: parsed.data.phone || null,
            email: parsed.data.email || null,
            description: parsed.data.description || null,
            modified: new Date(),
        };

        if (parsed.data.password) {
            updateData.password = await hashPassword(parsed.data.password);
        }

        await prisma.staff.update({
            where: { staffid: id },
            data: updateData,
        });

        revalidatePath("/dashboard/staff");
        return { success: true, message: "Staff member updated successfully" };
    } catch (error) {
        console.error("Update staff error:", error);
        return { success: false, message: "Failed to update staff member" };
    }
}

export async function deleteStaff(id: number): Promise<ActionResponse> {
    try {
        await prisma.staff.delete({ where: { staffid: id } });
        revalidatePath("/dashboard/staff");
        return { success: true, message: "Staff member deleted successfully" };
    } catch (error) {
        console.error("Delete staff error:", error);
        return { success: false, message: "Cannot delete: staff member may be assigned to groups" };
    }
}
