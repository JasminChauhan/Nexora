import { getMeetings } from "@/actions/meetings";
import { getProjectGroups } from "@/actions/project-groups";
import { getStaffList } from "@/actions/staff";
import { getSession } from "@/lib/auth";
import { MeetingsClient } from "./client";

export default async function MeetingsPage() {
    const session = await getSession();
    const [meetings, groups, staff] = await Promise.all([
        getMeetings(),
        getProjectGroups(),
        getStaffList(),
    ]);

    return <MeetingsClient meetings={meetings} groups={groups} staff={staff} userRole={session?.role || "student"} />;
}
