import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { Card, CardContent } from "@/components/ui/card";
import { FileText } from "lucide-react";

export default async function DocumentsPage() {
    const session = await getSession();
    if (!session || session.role !== "student") {
        redirect("/dashboard");
    }

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-zinc-900 tracking-tight">Documents</h1>
                <p className="text-zinc-500 text-sm mt-1">Your project documents and files</p>
            </div>

            <Card>
                <CardContent className="p-12">
                    <div className="flex flex-col items-center text-center">
                        <div className="w-16 h-16 rounded-2xl bg-zinc-100 flex items-center justify-center mb-4">
                            <FileText className="w-8 h-8 text-zinc-400" />
                        </div>
                        <p className="font-medium text-zinc-900">No Documents Yet</p>
                        <p className="text-sm text-zinc-500 mt-1 max-w-md">
                            Project documents will appear here once they are uploaded by your guide or group leader.
                        </p>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
