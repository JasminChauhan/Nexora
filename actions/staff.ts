"use server";

import { prisma } from "@/lib/prisma";
import { staffSchema, staffUpdateSchema } from "@/lib/validations";
import { hashPassword, getSession } from "@/lib/auth";
import { requireAdmin } from "@/lib/roles";
import type { ActionResponse } from "@/types";
import { revalidatePath } from "next/cache";

export async function getStaff(search?: string) {
    const session = await getSession();
    if (!session) throw new Error("Unauthorized");
    requireAdmin(session.role);

    return prisma.staff.findMany({
        where: search
            ? {
                admin_id: session.adminId,
                OR: [
                    { staffname: { contains: search, mode: "insensitive" } },
                    { email: { contains: search, mode: "insensitive" } },
                ],
            }
            : { admin_id: session.adminId },
        orderBy: { staffid: "desc" },
    });
}

export async function getStaffById(id: number) {
    const session = await getSession();
    if (!session) throw new Error("Unauthorized");
    requireAdmin(session.role);

    return prisma.staff.findUnique({ where: { staffid: id, admin_id: session.adminId } });
}

// Public helper for dropdowns — returns minimal data (used by project group forms)
export async function getStaffList() {
    const session = await getSession();
    if (!session) return [];

    return prisma.staff.findMany({
        where: { admin_id: session.adminId },
        select: { staffid: true, staffname: true, email: true },
        orderBy: { staffname: "asc" },
    });
}

export async function createStaff(formData: FormData): Promise<ActionResponse> {
    const session = await getSession();
    if (!session) return { success: false, message: "Unauthorized" };
    try { requireAdmin(session.role); } catch { return { success: false, message: "Admin access required" }; }

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

        await prisma.$transaction(async (tx) => {
            await tx.staff.create({
                data: {
                    staffname: parsed.data.staffname,
                    phone: parsed.data.phone || null,
                    email: parsed.data.email || null,
                    password: hashedPassword,
                    description: parsed.data.description || null,
                    admin_id: session.adminId, // tenant link
                },
            });

            if (parsed.data.email) {
                const existingUser = await tx.users.findUnique({
                    where: { email: parsed.data.email },
                });
                if (existingUser) {
                    throw new Error("Email already used for another account");
                }
                await tx.users.create({
                    data: {
                        username: parsed.data.staffname.toLowerCase().replace(/\s+/g, "_") + Math.floor(Math.random() * 1000),
                        email: parsed.data.email,
                        password_hash: hashedPassword,
                        role: "faculty",
                        is_active: true,
                        admin_id: session.adminId, // link user to admin
                    },
                });
            }
        });

        revalidatePath("/dashboard/staff");
        return { success: true, message: "Staff member created successfully" };
    } catch (error) {
        console.error("Create staff error:", error);
        return { success: false, message: "Failed to create staff member" };
    }
}

export async function updateStaff(id: number, formData: FormData): Promise<ActionResponse> {
    const session = await getSession();
    if (!session) return { success: false, message: "Unauthorized" };
    try { requireAdmin(session.role); } catch { return { success: false, message: "Admin access required" }; }

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

        // Get existing staff to find old email for user sync
        const existingStaff = await prisma.staff.findUnique({ where: { staffid: id } });
        if (!existingStaff || existingStaff.admin_id !== session.adminId) {
            return { success: false, message: "Staff member not found or unauthorized" };
        }

        await prisma.$transaction(async (tx) => {
            await tx.staff.update({
                where: { staffid: id },
                data: updateData,
            });

            if (existingStaff.email) {
                const userUpdateData: Record<string, unknown> = {};
                if (parsed.data.email && parsed.data.email !== existingStaff.email) {
                    const emailCheck = await tx.users.findUnique({ where: { email: parsed.data.email } });
                    if (emailCheck) throw new Error("Email already in use");
                    userUpdateData.email = parsed.data.email;
                }
                if (parsed.data.staffname) {
                    userUpdateData.username = parsed.data.staffname.toLowerCase().replace(/\s+/g, "_") + Math.floor(Math.random() * 1000);
                }
                if (parsed.data.password) {
                    userUpdateData.password_hash = updateData.password;
                }
                if (Object.keys(userUpdateData).length > 0) {
                    await tx.users.updateMany({
                        where: { email: existingStaff.email, role: "faculty" },
                        data: userUpdateData,
                    });
                }
            }
        });

        revalidatePath("/dashboard/staff");
        return { success: true, message: "Staff member updated successfully" };
    } catch (error) {
        console.error("Update staff error:", error);
        return { success: false, message: "Failed to update staff member" };
    }
}

export async function deleteStaff(id: number): Promise<ActionResponse> {
    const session = await getSession();
    if (!session) return { success: false, message: "Unauthorized" };
    try { requireAdmin(session.role); } catch { return { success: false, message: "Admin access required" }; }

    try {
        // Delete the corresponding user account first
        const staffRecord = await prisma.staff.findUnique({ where: { staffid: id } });
        if (!staffRecord || staffRecord.admin_id !== session.adminId) {
            return { success: false, message: "Staff member not found or unauthorized" };
        }

        await prisma.$transaction(async (tx) => {
            if (staffRecord.email) {
                await tx.users.deleteMany({
                    where: { email: staffRecord.email, role: "faculty" },
                });
            }
            await tx.staff.delete({ where: { staffid: id } });
        });
        revalidatePath("/dashboard/staff");
        return { success: true, message: "Staff member deleted successfully" };
    } catch (error) {
        console.error("Delete staff error:", error);
        return { success: false, message: "Cannot delete: staff member may be assigned to groups" };
    }
}
