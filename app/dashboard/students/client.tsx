"use client";

import { useState, useTransition, useCallback, useEffect, useRef } from "react";
import { createStudent, updateStudent, deleteStudent } from "@/actions/students";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/toast";
import { Plus, Pencil, Trash2, Users, Loader2, Search, Mail, Phone, ChevronLeft, ChevronRight } from "lucide-react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";

interface StudentData {
    studentid: number;
    studentname: string;
    phone: string | null;
    email: string | null;
    description: string | null;
    created: Date | null;
    projectgroupmember: {
        projectgroup: {
            projectgroupname: string;
            projecttitle: string;
        };
    }[];
}

interface PaginatedData {
    data: StudentData[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
}

export function StudentsClient({
    initialData,
    initialSearch,
}: {
    initialData: PaginatedData;
    initialSearch: string;
}) {
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();
    const { addToast } = useToast();
    const [dialogOpen, setDialogOpen] = useState(false);
    const [editItem, setEditItem] = useState<StudentData | null>(null);
    const [loading, setLoading] = useState(false);
    const [deleteConfirm, setDeleteConfirm] = useState<number | null>(null);
    const [search, setSearch] = useState(initialSearch);
    const [isPending, startTransition] = useTransition();
    const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

    const { data: students, total, page, totalPages } = initialData;

    const navigateWithSearch = useCallback((searchValue: string, pageValue?: number) => {
        const params = new URLSearchParams();
        if (searchValue) params.set("search", searchValue);
        if (pageValue && pageValue > 1) params.set("page", pageValue.toString());
        const queryString = params.toString();
        startTransition(() => {
            router.push(`${pathname}${queryString ? `?${queryString}` : ""}`);
        });
    }, [pathname, router]);

    function handleSearch(e: React.FormEvent) {
        e.preventDefault();
        if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
        navigateWithSearch(search);
    }

    function handleSearchChange(value: string) {
        setSearch(value);
        if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
        debounceTimerRef.current = setTimeout(() => {
            navigateWithSearch(value);
        }, 400);
    }

    // Clean up debounce timer on unmount
    useEffect(() => {
        return () => {
            if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
        };
    }, []);

    function goToPage(p: number) {
        navigateWithSearch(search, p);
    }

    async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault();
        setLoading(true);
        const formData = new FormData(e.currentTarget);

        const result = editItem
            ? await updateStudent(editItem.studentid, formData)
            : await createStudent(formData);

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
        const result = await deleteStudent(id);
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
                    <h1 className="text-2xl font-bold text-zinc-900 tracking-tight">Students</h1>
                    <p className="text-zinc-500 text-sm mt-1">Manage student records and group memberships</p>
                </div>
                <Dialog open={dialogOpen} onOpenChange={(open) => { setDialogOpen(open); if (!open) setEditItem(null); }}>
                    <DialogTrigger asChild>
                        <Button><Plus className="w-4 h-4 mr-2" />Add Student</Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>{editItem ? "Edit" : "Add"} Student</DialogTitle>
                            <DialogDescription>{editItem ? "Update student details" : "Add a new student"}</DialogDescription>
                        </DialogHeader>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="studentname">Name *</Label>
                                <Input id="studentname" name="studentname" defaultValue={editItem?.studentname || ""} required placeholder="Full name" />
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
                                <Label htmlFor="password">Password {!editItem && "*"}</Label>
                                <Input
                                    id="password"
                                    name="password"
                                    type="password"
                                    required={!editItem}
                                    minLength={6}
                                    placeholder={editItem ? "Leave blank to keep current password" : "Minimum 6 characters"}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="description">Description</Label>
                                <Textarea id="description" name="description" defaultValue={editItem?.description || ""} placeholder="Enrollment number, branch, etc." rows={2} />
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
                        <CardTitle className="text-base flex items-center gap-2">
                            <Users className="w-4 h-4" />All Students ({total})
                        </CardTitle>
                        <form onSubmit={handleSearch} className="relative w-64">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                            <Input placeholder="Search students..." value={search} onChange={(e) => handleSearchChange(e.target.value)} className="pl-9 h-9" />
                            {isPending && <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400 animate-spin" />}
                        </form>
                    </div>
                </CardHeader>
                <CardContent className="p-0">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Name</TableHead>
                                <TableHead>Contact</TableHead>
                                <TableHead>Groups</TableHead>
                                <TableHead>Description</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {students.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={5} className="text-center text-zinc-400 py-12">
                                        {search ? "No matching students" : "No students yet"}
                                    </TableCell>
                                </TableRow>
                            ) : (
                                students.map((s) => (
                                    <TableRow key={s.studentid}>
                                        <TableCell>
                                            <div className="flex items-center gap-3">
                                                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white text-sm font-medium">
                                                    {s.studentname.charAt(0)}
                                                </div>
                                                <span className="font-medium">{s.studentname}</span>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="space-y-1">
                                                {s.email && <div className="flex items-center gap-1.5 text-sm text-zinc-600"><Mail className="w-3.5 h-3.5" />{s.email}</div>}
                                                {s.phone && <div className="flex items-center gap-1.5 text-sm text-zinc-600"><Phone className="w-3.5 h-3.5" />{s.phone}</div>}
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            {s.projectgroupmember.length > 0 ? (
                                                <div className="flex flex-wrap gap-1">
                                                    {s.projectgroupmember.map((m, i) => (
                                                        <Badge key={i} variant="secondary" className="text-xs">{m.projectgroup.projectgroupname}</Badge>
                                                    ))}
                                                </div>
                                            ) : (
                                                <span className="text-zinc-400 text-sm">No group</span>
                                            )}
                                        </TableCell>
                                        <TableCell className="text-zinc-500 max-w-xs truncate">{s.description || "—"}</TableCell>
                                        <TableCell className="text-right">
                                            <div className="flex items-center justify-end gap-1">
                                                <Button variant="ghost" size="icon" onClick={() => { setEditItem(s); setDialogOpen(true); }}><Pencil className="w-4 h-4" /></Button>
                                                {deleteConfirm === s.studentid ? (
                                                    <div className="flex items-center gap-1">
                                                        <Button variant="destructive" size="sm" onClick={() => handleDelete(s.studentid)} disabled={loading}>Confirm</Button>
                                                        <Button variant="ghost" size="sm" onClick={() => setDeleteConfirm(null)}>Cancel</Button>
                                                    </div>
                                                ) : (
                                                    <Button variant="ghost" size="icon" onClick={() => setDeleteConfirm(s.studentid)}><Trash2 className="w-4 h-4 text-red-500" /></Button>
                                                )}
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>

                    {/* Pagination */}
                    {totalPages > 1 && (
                        <div className="flex items-center justify-between px-4 py-3 border-t border-zinc-100">
                            <p className="text-sm text-zinc-500">
                                Showing {(page - 1) * 10 + 1} to {Math.min(page * 10, total)} of {total}
                            </p>
                            <div className="flex items-center gap-1">
                                <Button variant="outline" size="sm" disabled={page === 1} onClick={() => goToPage(page - 1)}>
                                    <ChevronLeft className="w-4 h-4" />
                                </Button>
                                {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                                    <Button key={p} variant={p === page ? "default" : "outline"} size="sm" onClick={() => goToPage(p)} className="w-8">
                                        {p}
                                    </Button>
                                ))}
                                <Button variant="outline" size="sm" disabled={page === totalPages} onClick={() => goToPage(page + 1)}>
                                    <ChevronRight className="w-4 h-4" />
                                </Button>
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
