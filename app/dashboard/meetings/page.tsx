import { getMeetings } from "@/actions/meetings";
import { getProjectGroups } from "@/actions/project-groups";
import { getStaff } from "@/actions/staff";
import { MeetingsClient } from "./client";

export default async function MeetingsPage() {
    const [meetings, groups, staff] = await Promise.all([
        getMeetings(),
        getProjectGroups(),
        getStaff(),
    ]);

    return <MeetingsClient meetings={meetings} groups={groups} staff={staff} />;
}
