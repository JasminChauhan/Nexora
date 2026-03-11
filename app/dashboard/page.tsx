import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { AdminDashboard } from "@/components/dashboards/admin-dashboard";
import { FacultyDashboard } from "@/components/dashboards/faculty-dashboard";
import { StudentDashboard } from "@/components/dashboards/student-dashboard";

export default async function DashboardPage() {
    const session = await getSession();

    if (!session) {
        redirect("/login");
    }

    switch (session.role) {
        case "admin":
            return <AdminDashboard username={session.username} />;
        case "faculty":
            return (
                <FacultyDashboard
                    username={session.username}
                    userEmail={session.email}
                />
            );
        case "student":
            return (
                <StudentDashboard
                    username={session.username}
                    userEmail={session.email}
                />
            );
        default:
            redirect("/login");
    }
}
