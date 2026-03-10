import { getStudents } from "@/actions/students";
import { StudentsClient } from "./client";

export default async function StudentsPage({
    searchParams,
}: {
    searchParams: Promise<{ search?: string; page?: string }>;
}) {
    const params = await searchParams;
    const search = params.search || "";
    const page = parseInt(params.page || "1", 10);

    const result = await getStudents(search, page, 10);

    return <StudentsClient initialData={result} initialSearch={search} />;
}
