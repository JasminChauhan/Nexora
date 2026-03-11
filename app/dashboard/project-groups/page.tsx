import { getProjectGroups } from "@/actions/project-groups";
import { getProjectTypes } from "@/actions/project-types";
import { getStaffList } from "@/actions/staff";
import { getAllStudents } from "@/actions/students";
import { getSession } from "@/lib/auth";
import { ProjectGroupsClient } from "./client";

export default async function ProjectGroupsPage() {
    const session = await getSession();
    const [groups, projectTypes, staff, students] = await Promise.all([
        getProjectGroups(),
        getProjectTypes(),
        getStaffList(),
        getAllStudents(),
    ]);

    return (
        <ProjectGroupsClient
            groups={groups}
            projectTypes={projectTypes}
            staff={staff}
            students={students}
            userRole={session?.role || "student"}
        />
    );
}
