"use server";

import { prisma } from "@/lib/prisma";
import {
    hashPassword,
    verifyPassword,
    createToken,
    setSessionCookie,
    clearSessionCookie,
} from "@/lib/auth";
import { loginSchema } from "@/lib/validations";
import type { ActionResponse } from "@/types";
import { redirect } from "next/navigation";

export async function loginAction(formData: FormData): Promise<ActionResponse> {
    const raw = {
        email: formData.get("email") as string,
        password: formData.get("password") as string,
        role: formData.get("role") as string,
    };

    const parsed = loginSchema.safeParse(raw);
    if (!parsed.success) {
        return {
            success: false,
            message: "Validation failed",
            errors: parsed.error.flatten().fieldErrors,
        };
    }

    const { email, password, role } = parsed.data;

    try {
        // Check in users table
        const user = await prisma.users.findUnique({
            where: { email },
        });

        if (!user) {
            return { success: false, message: "Invalid email or password" };
        }

        const isValid = await verifyPassword(password, user.password_hash);
        if (!isValid) {
            return { success: false, message: "Invalid email or password" };
        }

        // Verify role matches
        if (user.role !== role) {
            return { success: false, message: `This account does not have ${role} access` };
        }

        if (!user.is_active) {
            return { success: false, message: "Account is deactivated" };
        }

        let adminId = user.id; // admin owns their own tenant
        let staffId: number | undefined;
        let studentId: number | undefined;

        if (role === "faculty") {
            const staff = await prisma.staff.findFirst({ where: { email } });
            if (!staff || !staff.admin_id) {
                return { success: false, message: "Faculty profile not fully configured (missing admin link). Contact admin." };
            }
            staffId = staff.staffid;
            adminId = staff.admin_id;
        } else if (role === "student") {
            const student = await prisma.student.findFirst({ where: { email } });
            if (!student || !student.admin_id) {
                return { success: false, message: "Student profile not fully configured (missing admin link). Contact admin." };
            }
            studentId = student.studentid;
            adminId = student.admin_id;
        }

        const token = await createToken({
            id: user.id,
            username: user.username,
            email: user.email,
            role: user.role as "admin" | "faculty" | "student",
            adminId,
            staffId,
            studentId,
        });

        await setSessionCookie(token);

        return { success: true, message: "Login successful" };
    } catch (error) {
        console.error("Login error:", error);
        return { success: false, message: "An error occurred during login" };
    }
}

export async function logoutAction(): Promise<void> {
    await clearSessionCookie();
    redirect("/login");
}

export async function registerAdminAction(formData: FormData): Promise<ActionResponse> {
    const raw = {
        username: formData.get("username") as string,
        email: formData.get("email") as string,
        password: formData.get("password") as string,
        confirmPassword: formData.get("confirmPassword") as string,
    };

    const parsed = (await import("@/lib/validations")).adminRegisterSchema.safeParse(raw);
    
    if (!parsed.success) {
        return {
            success: false,
            message: "Validation failed",
            errors: parsed.error.flatten().fieldErrors,
        };
    }

    const { username, email, password } = parsed.data;

    try {
        const existingAdmin = await prisma.users.findUnique({
            where: { email },
        });

        if (existingAdmin) {
            return { success: false, message: "Email is already registered" };
        }

        const hashedPassword = await hashPassword(password);

        await prisma.users.create({
            data: {
                username,
                email,
                password_hash: hashedPassword,
                role: "admin",
                is_active: true,
            },
        });

        return { success: true, message: "Admin account registered successfully. Please sign in." };
    } catch (error) {
        console.error("Register error:", error);
        return { success: false, message: "Failed to create admin account" };
    }
}
