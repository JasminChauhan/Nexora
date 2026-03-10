import { getProjectTypes } from "@/actions/project-types";
import { ProjectTypeClient } from "./client";

export default async function ProjectTypesPage() {
    const projectTypes = await getProjectTypes();
    return <ProjectTypeClient projectTypes={projectTypes} />;
}
