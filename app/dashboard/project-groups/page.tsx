import { getProjectGroups } from "@/actions/project-groups";
import { getProjectTypes } from "@/actions/project-types";
import { getStaff } from "@/actions/staff";
import { getAllStudents } from "@/actions/students";
import { ProjectGroupsClient } from "./client";

export default async function ProjectGroupsPage() {
    const [groups, projectTypes, staff, students] = await Promise.all([
        getProjectGroups(),
        getProjectTypes(),
        getStaff(),
        getAllStudents(),
    ]);

    return (
        <ProjectGroupsClient
            groups={groups}
            projectTypes={projectTypes}
            staff={staff}
            students={students}
        />
    );
}
