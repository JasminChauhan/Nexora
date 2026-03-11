import type { UserRole } from "@/types";
import {
    LayoutDashboard,
    Users,
    UserCog,
    FolderKanban,
    UsersRound,
    Calendar,
    BarChart3,
    ClipboardCheck,
    FileText,
    type LucideIcon,
} from "lucide-react";

// ─── Role Constants ───────────────────────────────────────────────
export const Role = {
    ADMIN: "admin" as UserRole,
    FACULTY: "faculty" as UserRole,
    STUDENT: "student" as UserRole,
} as const;

// ─── Navigation Item Type ─────────────────────────────────────────
export interface NavItem {
    href: string;
    label: string;
    icon: LucideIcon;
}

// ─── Role-Based Navbar Configs ────────────────────────────────────
const adminNavItems: NavItem[] = [
    { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { href: "/dashboard/students", label: "Students", icon: Users },
    { href: "/dashboard/staff", label: "Staff", icon: UserCog },
    { href: "/dashboard/project-types", label: "Project Types", icon: FolderKanban },
    { href: "/dashboard/project-groups", label: "Project Groups", icon: UsersRound },
    { href: "/dashboard/meetings", label: "Meetings", icon: Calendar },
    { href: "/dashboard/reports", label: "Reports", icon: BarChart3 },
];

const facultyNavItems: NavItem[] = [
    { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { href: "/dashboard/project-groups", label: "My Projects", icon: UsersRound },
    { href: "/dashboard/meetings", label: "Meetings", icon: Calendar },
    { href: "/dashboard/attendance", label: "Attendance", icon: ClipboardCheck },
];

const studentNavItems: NavItem[] = [
    { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { href: "/dashboard/my-project", label: "My Project", icon: UsersRound },
    { href: "/dashboard/meetings", label: "Meetings", icon: Calendar },
    { href: "/dashboard/documents", label: "Documents", icon: FileText },
];

export function getNavItemsForRole(role: UserRole): NavItem[] {
    switch (role) {
        case Role.ADMIN:
            return adminNavItems;
        case Role.FACULTY:
            return facultyNavItems;
        case Role.STUDENT:
            return studentNavItems;
        default:
            return [];
    }
}

// ─── Route Access Control ─────────────────────────────────────────
// Routes that are restricted to specific roles.
// If a route prefix is listed under a role, ONLY that role can access it.
const roleRouteAccess: Record<UserRole, string[]> = {
    admin: [
        "/dashboard/students",
        "/dashboard/staff",
        "/dashboard/project-types",
        "/dashboard/reports",
    ],
    faculty: [
        "/dashboard/attendance",
    ],
    student: [
        "/dashboard/my-project",
        "/dashboard/documents",
    ],
};

// Shared routes any authenticated user can access
const sharedRoutes = [
    "/dashboard",
    "/dashboard/profile",
    "/dashboard/project-groups",
    "/dashboard/meetings",
];

/**
 * Check if a given role is permitted to access a given pathname.
 * Returns true if allowed, false if denied.
 */
export function isRouteAllowedForRole(pathname: string, role: UserRole): boolean {
    // Shared routes are allowed for everyone
    for (const shared of sharedRoutes) {
        if (pathname === shared || pathname.startsWith(shared + "/")) {
            // Check if the shared route also appears in a role-restricted list
            // (project-groups and meetings are shared but may need more nuanced checks)
            return true;
        }
    }

    // Check if this route belongs to a role-specific section
    for (const [restrictedRole, routes] of Object.entries(roleRouteAccess)) {
        for (const route of routes) {
            if (pathname === route || pathname.startsWith(route + "/")) {
                // Only the owning role can access this route
                return role === restrictedRole;
            }
        }
    }

    // If none of the above matched, it's an unknown route – allow (Next.js will 404)
    return true;
}

/**
 * Get the dashboard URL for a given role.
 */
export function getDashboardUrl(_role: UserRole): string {
    // All roles use the same /dashboard — content is role-specific
    return "/dashboard";
}

// ─── Authorization Helpers ────────────────────────────────────────
export function requireRole(userRole: UserRole, allowedRoles: UserRole[]): void {
    if (!allowedRoles.includes(userRole)) {
        throw new Error("Unauthorized: insufficient permissions");
    }
}

export function checkRole(userRole: UserRole, allowedRoles: UserRole[]): boolean {
    return allowedRoles.includes(userRole);
}

export function requireAdmin(userRole: UserRole): void {
    requireRole(userRole, [Role.ADMIN]);
}

export function requireFaculty(userRole: UserRole): void {
    requireRole(userRole, [Role.FACULTY]);
}

export function requireStudent(userRole: UserRole): void {
    requireRole(userRole, [Role.STUDENT]);
}

export function requireAdminOrFaculty(userRole: UserRole): void {
    requireRole(userRole, [Role.ADMIN, Role.FACULTY]);
}
