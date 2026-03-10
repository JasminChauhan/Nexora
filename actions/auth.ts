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

        const token = await createToken({
            id: user.id,
            username: user.username,
            email: user.email,
            role: user.role as "admin" | "faculty" | "student",
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

export async function seedAdminAction(): Promise<ActionResponse> {
    try {
        const existingAdmin = await prisma.users.findFirst({
            where: { role: "admin" },
        });

        if (existingAdmin) {
            return { success: false, message: "Admin account already exists" };
        }

        const hashedPassword = await hashPassword("admin123");

        await prisma.users.create({
            data: {
                username: "admin",
                email: "admin@spms.com",
                password_hash: hashedPassword,
                role: "admin",
                is_active: true,
            },
        });

        return { success: true, message: "Admin account created. Email: admin@spms.com, Password: admin123" };
    } catch (error) {
        console.error("Seed error:", error);
        return { success: false, message: "Failed to create admin account" };
    }
}
