"use client";

import { useState } from "react";
import { createStaff, updateStaff, deleteStaff } from "@/actions/staff";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
    Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
    Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import { useToast } from "@/components/ui/toast";
import { Plus, Pencil, Trash2, UserCog, Loader2, Search, Mail, Phone } from "lucide-react";
import { useRouter } from "next/navigation";

interface Staff {
    staffid: number;
    staffname: string;
    phone: string | null;
    email: string | null;
    description: string | null;
    created: Date | null;
}

export function StaffClient({ staff }: { staff: Staff[] }) {
    const router = useRouter();
    const { addToast } = useToast();
    const [dialogOpen, setDialogOpen] = useState(false);
    const [editItem, setEditItem] = useState<Staff | null>(null);
    const [loading, setLoading] = useState(false);
    const [deleteConfirm, setDeleteConfirm] = useState<number | null>(null);
    const [search, setSearch] = useState("");

    const filtered = staff.filter(
        (s) =>
            s.staffname.toLowerCase().includes(search.toLowerCase()) ||
            s.email?.toLowerCase().includes(search.toLowerCase()) ||
            s.phone?.includes(search)
    );

    async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault();
        setLoading(true);
        const formData = new FormData(e.currentTarget);

        const result = editItem
            ? await updateStaff(editItem.staffid, formData)
            : await createStaff(formData);

        if (result.success) {
            addToast({ title: result.message, variant: "success" });
            setDialogOpen(false);
            setEditItem(null);
            router.refresh();
        } else {
            addToast({ title: result.message, description: result.errors ? Object.values(result.errors).flat().join(". ") : undefined, variant: "destructive" });
        }
        setLoading(false);
    }

    async function handleDelete(id: number) {
        setLoading(true);
        const result = await deleteStaff(id);
        if (result.success) {
            addToast({ title: result.message, variant: "success" });
            router.refresh();
        } else {
            addToast({ title: result.message, variant: "destructive" });
        }
        setDeleteConfirm(null);
        setLoading(false);
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-zinc-900 tracking-tight">Staff Management</h1>
                    <p className="text-zinc-500 text-sm mt-1">Manage faculty guides, conveners, and experts</p>
                </div>
                <Dialog open={dialogOpen} onOpenChange={(open) => { setDialogOpen(open); if (!open) setEditItem(null); }}>
                    <DialogTrigger asChild>
                        <Button><Plus className="w-4 h-4 mr-2" />Add Staff</Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>{editItem ? "Edit" : "Add"} Staff Member</DialogTitle>
                            <DialogDescription>{editItem ? "Update staff details" : "Add a new staff member"}</DialogDescription>
                        </DialogHeader>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="staffname">Name *</Label>
                                <Input id="staffname" name="staffname" defaultValue={editItem?.staffname || ""} required placeholder="Full name" />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="email">Email</Label>
                                    <Input id="email" name="email" type="email" defaultValue={editItem?.email || ""} placeholder="email@example.com" />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="phone">Phone</Label>
                                    <Input id="phone" name="phone" defaultValue={editItem?.phone || ""} placeholder="Phone number" />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="password">Password {editItem ? "(leave blank to keep)" : "*"}</Label>
                                <Input id="password" name="password" type="password" required={!editItem} placeholder="Minimum 6 characters" />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="description">Description</Label>
                                <Textarea id="description" name="description" defaultValue={editItem?.description || ""} placeholder="Role, department, etc." rows={2} />
                            </div>
                            <DialogFooter>
                                <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
                                <Button type="submit" disabled={loading}>
                                    {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                                    {editItem ? "Update" : "Create"}
                                </Button>
                            </DialogFooter>
                        </form>
                    </DialogContent>
                </Dialog>
            </div>

            <Card>
                <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                        <CardTitle className="text-base flex items-center gap-2"><UserCog className="w-4 h-4" />All Staff ({filtered.length})</CardTitle>
                        <div className="relative w-64">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                            <Input placeholder="Search staff..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9 h-9" />
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="p-0">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Name</TableHead>
                                <TableHead>Contact</TableHead>
                                <TableHead>Description</TableHead>
                                <TableHead className="text-center">Joined</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {filtered.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={5} className="text-center text-zinc-400 py-12">
                                        {search ? "No matching staff" : "No staff members yet"}
                                    </TableCell>
                                </TableRow>
                            ) : (
                                filtered.map((s) => (
                                    <TableRow key={s.staffid}>
                                        <TableCell>
                                            <div className="flex items-center gap-3">
                                                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center text-white text-sm font-medium">
                                                    {s.staffname.charAt(0)}
                                                </div>
                                                <span className="font-medium">{s.staffname}</span>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="space-y-1">
                                                {s.email && (
                                                    <div className="flex items-center gap-1.5 text-sm text-zinc-600">
                                                        <Mail className="w-3.5 h-3.5" />{s.email}
                                                    </div>
                                                )}
                                                {s.phone && (
                                                    <div className="flex items-center gap-1.5 text-sm text-zinc-600">
                                                        <Phone className="w-3.5 h-3.5" />{s.phone}
                                                    </div>
                                                )}
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-zinc-500 max-w-xs truncate">{s.description || "—"}</TableCell>
                                        <TableCell className="text-center text-zinc-500 text-sm">
                                            {s.created ? new Date(s.created).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) : "—"}
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <div className="flex items-center justify-end gap-1">
                                                <Button variant="ghost" size="icon" onClick={() => { setEditItem(s); setDialogOpen(true); }}>
                                                    <Pencil className="w-4 h-4" />
                                                </Button>
                                                {deleteConfirm === s.staffid ? (
                                                    <div className="flex items-center gap-1">
                                                        <Button variant="destructive" size="sm" onClick={() => handleDelete(s.staffid)} disabled={loading}>Confirm</Button>
                                                        <Button variant="ghost" size="sm" onClick={() => setDeleteConfirm(null)}>Cancel</Button>
                                                    </div>
                                                ) : (
                                                    <Button variant="ghost" size="icon" onClick={() => setDeleteConfirm(s.staffid)}>
                                                        <Trash2 className="w-4 h-4 text-red-500" />
                                                    </Button>
                                                )}
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    );
}
