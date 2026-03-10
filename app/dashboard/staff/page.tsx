import { getStaff } from "@/actions/staff";
import { StaffClient } from "./client";

export default async function StaffPage() {
    const staff = await getStaff();
    return <StaffClient staff={staff} />;
}
