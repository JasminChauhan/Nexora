import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { Navbar } from "@/components/navbar";
import { ToastProvider } from "@/components/ui/toast";

export default async function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const session = await getSession();

    if (!session) {
        redirect("/login");
    }

    return (
        <ToastProvider>
            <div className="min-h-screen bg-zinc-50/50">
                <Navbar user={session} />
                <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
                    {children}
                </main>
            </div>
        </ToastProvider>
    );
}
