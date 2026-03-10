"use client";

import { useState } from "react";
import { createProjectType, updateProjectType, deleteProjectType } from "@/actions/project-types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/toast";
import { Plus, Pencil, Trash2, FolderKanban, Loader2, Search } from "lucide-react";
import { useRouter } from "next/navigation";

interface ProjectType {
    projecttypeid: number;
    projecttypename: string;
    description: string | null;
    created: Date | null;
    _count: { projectgroup: number };
}

export function ProjectTypeClient({ projectTypes }: { projectTypes: ProjectType[] }) {
    const router = useRouter();
    const { addToast } = useToast();
    const [dialogOpen, setDialogOpen] = useState(false);
    const [editItem, setEditItem] = useState<ProjectType | null>(null);
    const [loading, setLoading] = useState(false);
    const [deleteConfirm, setDeleteConfirm] = useState<number | null>(null);
    const [search, setSearch] = useState("");

    const filtered = projectTypes.filter(
        (pt) =>
            pt.projecttypename.toLowerCase().includes(search.toLowerCase()) ||
            pt.description?.toLowerCase().includes(search.toLowerCase())
    );

    async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault();
        setLoading(true);
        const formData = new FormData(e.currentTarget);

        const result = editItem
            ? await updateProjectType(editItem.projecttypeid, formData)
            : await createProjectType(formData);

        if (result.success) {
            addToast({ title: result.message, variant: "success" });
            setDialogOpen(false);
            setEditItem(null);
            router.refresh();
        } else {
            addToast({ title: result.message, variant: "destructive" });
        }
        setLoading(false);
    }

    async function handleDelete(id: number) {
        setLoading(true);
        const result = await deleteProjectType(id);
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
                    <h1 className="text-2xl font-bold text-zinc-900 tracking-tight">Project Types</h1>
                    <p className="text-zinc-500 text-sm mt-1">
                        Manage project categories and classifications
                    </p>
                </div>
                <Dialog
                    open={dialogOpen}
                    onOpenChange={(open) => {
                        setDialogOpen(open);
                        if (!open) setEditItem(null);
                    }}
                >
                    <DialogTrigger asChild>
                        <Button>
                            <Plus className="w-4 h-4 mr-2" />
                            Add Project Type
                        </Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>{editItem ? "Edit" : "Add"} Project Type</DialogTitle>
                            <DialogDescription>
                                {editItem ? "Update the project type details" : "Create a new project type"}
                            </DialogDescription>
                        </DialogHeader>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="projecttypename">Name *</Label>
                                <Input
                                    id="projecttypename"
                                    name="projecttypename"
                                    defaultValue={editItem?.projecttypename || ""}
                                    required
                                    placeholder="e.g., Web Development"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="description">Description</Label>
                                <Textarea
                                    id="description"
                                    name="description"
                                    defaultValue={editItem?.description || ""}
                                    placeholder="Brief description of this project type"
                                    rows={3}
                                />
                            </div>
                            <DialogFooter>
                                <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                                    Cancel
                                </Button>
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
                            <FolderKanban className="w-4 h-4" />
                            All Project Types
                        </CardTitle>
                        <div className="relative w-64">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                            <Input
                                placeholder="Search project types..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="pl-9 h-9"
                            />
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="p-0">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Name</TableHead>
                                <TableHead>Description</TableHead>
                                <TableHead className="text-center">Projects</TableHead>
                                <TableHead className="text-center">Created</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {filtered.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={5} className="text-center text-zinc-400 py-12">
                                        {search ? "No matching project types" : "No project types yet. Create one to get started."}
                                    </TableCell>
                                </TableRow>
                            ) : (
                                filtered.map((pt) => (
                                    <TableRow key={pt.projecttypeid}>
                                        <TableCell className="font-medium">{pt.projecttypename}</TableCell>
                                        <TableCell className="text-zinc-500 max-w-xs truncate">
                                            {pt.description || "—"}
                                        </TableCell>
                                        <TableCell className="text-center">
                                            <Badge variant="secondary">{pt._count.projectgroup}</Badge>
                                        </TableCell>
                                        <TableCell className="text-center text-zinc-500 text-sm">
                                            {pt.created
                                                ? new Date(pt.created).toLocaleDateString("en-IN", {
                                                    day: "numeric",
                                                    month: "short",
                                                    year: "numeric",
                                                })
                                                : "—"}
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <div className="flex items-center justify-end gap-1">
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() => {
                                                        setEditItem(pt);
                                                        setDialogOpen(true);
                                                    }}
                                                >
                                                    <Pencil className="w-4 h-4" />
                                                </Button>
                                                {deleteConfirm === pt.projecttypeid ? (
                                                    <div className="flex items-center gap-1">
                                                        <Button
                                                            variant="destructive"
                                                            size="sm"
                                                            onClick={() => handleDelete(pt.projecttypeid)}
                                                            disabled={loading}
                                                        >
                                                            Confirm
                                                        </Button>
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            onClick={() => setDeleteConfirm(null)}
                                                        >
                                                            Cancel
                                                        </Button>
                                                    </div>
                                                ) : (
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        onClick={() => setDeleteConfirm(pt.projecttypeid)}
                                                    >
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
