import { getSession } from "@/lib/auth";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { User, Mail, Shield, Calendar } from "lucide-react";

export default async function ProfilePage() {
    const session = await getSession();

    if (!session) return null;

    return (
        <div className="space-y-6 max-w-2xl">
            <div>
                <h1 className="text-2xl font-bold text-zinc-900 tracking-tight">Profile</h1>
                <p className="text-zinc-500 text-sm mt-1">Your account information</p>
            </div>

            <Card>
                <CardHeader>
                    <div className="flex items-center gap-4">
                        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-zinc-700 to-zinc-900 flex items-center justify-center text-white text-2xl font-bold">
                            {session.username.charAt(0).toUpperCase()}
                        </div>
                        <div>
                            <CardTitle className="text-xl">{session.username}</CardTitle>
                            <CardDescription>{session.email}</CardDescription>
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="flex items-center gap-3 p-4 rounded-xl bg-zinc-50 border border-zinc-100">
                            <User className="w-5 h-5 text-zinc-500" />
                            <div>
                                <p className="text-xs text-zinc-500">Username</p>
                                <p className="text-sm font-medium">{session.username}</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3 p-4 rounded-xl bg-zinc-50 border border-zinc-100">
                            <Mail className="w-5 h-5 text-zinc-500" />
                            <div>
                                <p className="text-xs text-zinc-500">Email</p>
                                <p className="text-sm font-medium">{session.email}</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3 p-4 rounded-xl bg-zinc-50 border border-zinc-100">
                            <Shield className="w-5 h-5 text-zinc-500" />
                            <div>
                                <p className="text-xs text-zinc-500">Role</p>
                                <Badge variant="default" className="mt-0.5 capitalize">{session.role}</Badge>
                            </div>
                        </div>
                        <div className="flex items-center gap-3 p-4 rounded-xl bg-zinc-50 border border-zinc-100">
                            <Calendar className="w-5 h-5 text-zinc-500" />
                            <div>
                                <p className="text-xs text-zinc-500">Session</p>
                                <p className="text-sm font-medium">Active</p>
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
