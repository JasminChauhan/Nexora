export type UserRole = "admin" | "faculty" | "student";

export interface SessionUser {
    id: number;
    username: string;
    email: string;
    role: UserRole;
    adminId: number; // For multi-tenancy (tenant = admin)
    staffId?: number;
    studentId?: number;
}

export interface JWTPayload {
    userId: number;
    username: string;
    email: string;
    role: UserRole;
    adminId: number;
    staffId?: number;
    studentId?: number;
    iat: number;
    exp: number;
}

export interface ActionResponse<T = unknown> {
    success: boolean;
    message: string;
    data?: T;
    errors?: Record<string, string[]>;
}

export interface PaginationParams {
    page: number;
    limit: number;
    search?: string;
}

export interface PaginatedResult<T> {
    data: T[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
}
