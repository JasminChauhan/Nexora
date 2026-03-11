"use server";

import { prisma } from "@/lib/prisma";
import { studentSchema, studentUpdateSchema } from "@/lib/validations";
import { getSession, hashPassword } from "@/lib/auth";
import { requireAdmin } from "@/lib/roles";
import type { ActionResponse } from "@/types";
import { revalidatePath } from "next/cache";

export async function getStudents(search?: string, page = 1, limit = 10) {
    const session = await getSession();
    if (!session) throw new Error("Unauthorized");
    requireAdmin(session.role);

    const where = search
        ? {
            OR: [
                { studentname: { contains: search, mode: "insensitive" as const } },
                { email: { contains: search, mode: "insensitive" as const } },
            ],
        }
        : undefined;

    const [data, total] = await Promise.all([
        prisma.student.findMany({
            where,
            orderBy: { studentid: "desc" },
            skip: (page - 1) * limit,
            take: limit,
            include: {
                projectgroupmember: {
                    include: {
                        projectgroup: {
                            select: {
                                projectgroupname: true,
                                projecttitle: true,
                            },
                        },
                    },
                },
            },
        }),
        prisma.student.count({ where }),
    ]);

    return {
        data,
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
    };
}

export async function getAllStudents() {
    return prisma.student.findMany({
        orderBy: { studentname: "asc" },
    });
}

export async function getStudentById(id: number) {
    const session = await getSession();
    if (!session) throw new Error("Unauthorized");
    requireAdmin(session.role);

    return prisma.student.findUnique({
        where: { studentid: id },
        include: {
            projectgroupmember: {
                include: {
                    projectgroup: true,
                },
            },
        },
    });
}

export async function createStudent(formData: FormData): Promise<ActionResponse> {
    const session = await getSession();
    if (!session) return { success: false, message: "Unauthorized" };
    try { requireAdmin(session.role); } catch { return { success: false, message: "Admin access required" }; }

    const raw = {
        studentname: formData.get("studentname") as string,
        phone: formData.get("phone") as string,
        email: formData.get("email") as string,
        password: formData.get("password") as string,
        description: formData.get("description") as string,
    };

    const parsed = studentSchema.safeParse(raw);
    if (!parsed.success) {
        return {
            success: false,
            message: "Validation failed",
            errors: parsed.error.flatten().fieldErrors,
        };
    }

    try {
        await prisma.student.create({
            data: {
                studentname: parsed.data.studentname,
                phone: parsed.data.phone || null,
                email: parsed.data.email || null,
                description: parsed.data.description || null,
            },
        });

        // Also create a user record for student login
        if (parsed.data.email) {
            const existingUser = await prisma.users.findUnique({
                where: { email: parsed.data.email },
            });
            if (!existingUser) {
                const hashedPassword = await hashPassword(parsed.data.password);
                await prisma.users.create({
                    data: {
                        username: parsed.data.studentname.toLowerCase().replace(/\s+/g, "_"),
                        email: parsed.data.email,
                        password_hash: hashedPassword,
                        role: "student",
                        is_active: true,
                    },
                });
            }
        }

        revalidatePath("/dashboard/students");
        return { success: true, message: "Student created successfully" };
    } catch (error) {
        console.error("Create student error:", error);
        return { success: false, message: "Failed to create student" };
    }
}

export async function updateStudent(id: number, formData: FormData): Promise<ActionResponse> {
    const session = await getSession();
    if (!session) return { success: false, message: "Unauthorized" };
    try { requireAdmin(session.role); } catch { return { success: false, message: "Admin access required" }; }

    const raw = {
        studentname: formData.get("studentname") as string,
        phone: formData.get("phone") as string,
        email: formData.get("email") as string,
        password: formData.get("password") as string,
        description: formData.get("description") as string,
    };

    const parsed = studentUpdateSchema.safeParse(raw);
    if (!parsed.success) {
        return {
            success: false,
            message: "Validation failed",
            errors: parsed.error.flatten().fieldErrors,
        };
    }

    try {
        // Get existing student for user sync
        const existingStudent = await prisma.student.findUnique({ where: { studentid: id } });

        await prisma.student.update({
            where: { studentid: id },
            data: {
                studentname: parsed.data.studentname,
                phone: parsed.data.phone || null,
                email: parsed.data.email || null,
                description: parsed.data.description || null,
                modified: new Date(),
            },
        });

        // Sync changes to users table (for login)
        if (existingStudent?.email) {
            const userUpdateData: Record<string, unknown> = {};
            if (parsed.data.email && parsed.data.email !== existingStudent.email) {
                userUpdateData.email = parsed.data.email;
            }
            if (parsed.data.studentname) {
                userUpdateData.username = parsed.data.studentname.toLowerCase().replace(/\s+/g, "_");
            }
            if (parsed.data.password) {
                userUpdateData.password_hash = await hashPassword(parsed.data.password);
            }
            if (Object.keys(userUpdateData).length > 0) {
                await prisma.users.updateMany({
                    where: { email: existingStudent.email, role: "student" },
                    data: userUpdateData,
                });
            }
        }

        revalidatePath("/dashboard/students");
        return { success: true, message: "Student updated successfully" };
    } catch (error) {
        console.error("Update student error:", error);
        return { success: false, message: "Failed to update student" };
    }
}

export async function deleteStudent(id: number): Promise<ActionResponse> {
    const session = await getSession();
    if (!session) return { success: false, message: "Unauthorized" };
    try { requireAdmin(session.role); } catch { return { success: false, message: "Admin access required" }; }

    try {
        // Delete the corresponding user account first
        const studentRecord = await prisma.student.findUnique({ where: { studentid: id } });
        if (studentRecord?.email) {
            await prisma.users.deleteMany({
                where: { email: studentRecord.email, role: "student" },
            });
        }

        await prisma.student.delete({ where: { studentid: id } });
        revalidatePath("/dashboard/students");
        return { success: true, message: "Student deleted successfully" };
    } catch (error) {
        console.error("Delete student error:", error);
        return { success: false, message: "Cannot delete: student may be in a project group" };
    }
}
