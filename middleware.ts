import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { verifyToken } from "@/lib/auth";
import { isRouteAllowedForRole } from "@/lib/roles";
import type { UserRole } from "@/types";

const publicPrefixes = ["/login", "/api/seed"];
const publicExact = ["/"];

export async function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl;

    // Allow public paths (exact matches + prefix matches)
    if (
        publicExact.includes(pathname) ||
        publicPrefixes.some((path) => pathname.startsWith(path))
    ) {
        return NextResponse.next();
    }

    // Allow static files and api routes that don't need auth
    if (pathname.startsWith("/_next") || pathname.startsWith("/favicon")) {
        return NextResponse.next();
    }

    // Check for token
    const token = request.cookies.get("spms-token")?.value;

    if (!token) {
        return NextResponse.redirect(new URL("/login", request.url));
    }

    const payload = await verifyToken(token);
    if (!payload) {
        const response = NextResponse.redirect(new URL("/login", request.url));
        response.cookies.delete("spms-token");
        return response;
    }

    // Root is now the public landing page, handled by its own page.tsx

    // ─── RBAC Route Protection ────────────────────────────────────
    const userRole = payload.role as UserRole;

    if (pathname.startsWith("/dashboard")) {
        if (!isRouteAllowedForRole(pathname, userRole)) {
            // Redirect unauthorized users back to their dashboard
            return NextResponse.redirect(new URL("/dashboard", request.url));
        }
    }

    // Attach role to response headers so layouts can read it (optional optimization)
    const response = NextResponse.next();
    response.headers.set("x-user-role", userRole);
    return response;
}

export const config = {
    matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
