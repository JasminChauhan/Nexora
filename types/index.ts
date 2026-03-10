export type UserRole = "admin" | "faculty" | "student";

export interface SessionUser {
    id: number;
    username: string;
    email: string;
    role: UserRole;
}

export interface JWTPayload {
    userId: number;
    username: string;
    email: string;
    role: UserRole;
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
