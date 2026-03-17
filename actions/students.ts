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
            admin_id: session.adminId,
            OR: [
                { studentname: { contains: search, mode: "insensitive" as const } },
                { email: { contains: search, mode: "insensitive" as const } },
            ],
        }
        : { admin_id: session.adminId };

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
    const session = await getSession();
    if (!session) return [];

    return prisma.student.findMany({
        where: { admin_id: session.adminId },
        orderBy: { studentname: "asc" },
    });
}

export async function getStudentById(id: number) {
    const session = await getSession();
    if (!session) throw new Error("Unauthorized");
    requireAdmin(session.role);

    return prisma.student.findUnique({
        where: { studentid: id, admin_id: session.adminId },
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
        await prisma.$transaction(async (tx) => {
            await tx.student.create({
                data: {
                    studentname: parsed.data.studentname,
                    phone: parsed.data.phone || null,
                    email: parsed.data.email || null,
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
                const hashedPassword = await hashPassword(parsed.data.password);
                await tx.users.create({
                    data: {
                        username: parsed.data.studentname.toLowerCase().replace(/\s+/g, "_") + Math.floor(Math.random() * 1000),
                        email: parsed.data.email,
                        password_hash: hashedPassword,
                        role: "student",
                        is_active: true,
                        admin_id: session.adminId, // link user to admin
                    },
                });
            }
        });

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
        const existingStudent = await prisma.student.findUnique({ where: { studentid: id } });
        if (!existingStudent || existingStudent.admin_id !== session.adminId) {
            return { success: false, message: "Student not found or unauthorized" };
        }

        await prisma.$transaction(async (tx) => {
            await tx.student.update({
                where: { studentid: id },
                data: {
                    studentname: parsed.data.studentname,
                    phone: parsed.data.phone || null,
                    email: parsed.data.email || null,
                    description: parsed.data.description || null,
                    modified: new Date(),
                },
            });

            if (existingStudent.email) {
                const userUpdateData: Record<string, unknown> = {};
                if (parsed.data.email && parsed.data.email !== existingStudent.email) {
                    const emailCheck = await tx.users.findUnique({ where: { email: parsed.data.email } });
                    if (emailCheck) throw new Error("Email already in use");
                    userUpdateData.email = parsed.data.email;
                }
                if (parsed.data.studentname) {
                    userUpdateData.username = parsed.data.studentname.toLowerCase().replace(/\s+/g, "_") + Math.floor(Math.random() * 1000);
                }
                if (parsed.data.password) {
                    userUpdateData.password_hash = await hashPassword(parsed.data.password);
                }
                if (Object.keys(userUpdateData).length > 0) {
                    await tx.users.updateMany({
                        where: { email: existingStudent.email, role: "student" },
                        data: userUpdateData,
                    });
                }
            }
        });

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
        const studentRecord = await prisma.student.findUnique({ where: { studentid: id } });
        if (!studentRecord || studentRecord.admin_id !== session.adminId) {
            return { success: false, message: "Student not found or unauthorized" };
        }

        await prisma.$transaction(async (tx) => {
            if (studentRecord.email) {
                await tx.users.deleteMany({
                    where: { email: studentRecord.email, role: "student" },
                });
            }
            await tx.student.delete({ where: { studentid: id } });
        });
        revalidatePath("/dashboard/students");
        return { success: true, message: "Student deleted successfully" };
    } catch (error) {
        console.error("Delete student error:", error);
        return { success: false, message: "Cannot delete: student may be in a project group" };
    }
}
