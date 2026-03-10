"use client";

import { useState } from "react";
import {
    createProjectGroup,
    updateProjectGroup,
    deleteProjectGroup,
    addGroupMember,
    removeGroupMember,
    setGroupLeader,
    updateGroupStatus,
} from "@/actions/project-groups";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
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
import {
    Plus,
    Pencil,
    Trash2,
    UsersRound,
    Loader2,
    Search,
    UserPlus,
    Crown,
    X,
    Eye,
    CheckCircle,
    XCircle,
    Clock,
} from "lucide-react";
import { useRouter } from "next/navigation";
import Link from "next/link";

/* eslint-disable @typescript-eslint/no-explicit-any */

export function ProjectGroupsClient({
    groups,
    projectTypes,
    staff,
    students,
}: {
    groups: any[];
    projectTypes: any[];
    staff: any[];
    students: any[];
}) {
    const router = useRouter();
    const { addToast } = useToast();
    const [dialogOpen, setDialogOpen] = useState(false);
    const [editItem, setEditItem] = useState<any>(null);
    const [loading, setLoading] = useState(false);
    const [deleteConfirm, setDeleteConfirm] = useState<number | null>(null);
    const [search, setSearch] = useState("");
    const [memberDialog, setMemberDialog] = useState<any>(null);
    const [selectedStudent, setSelectedStudent] = useState("");
    const [memberCGPA, setMemberCGPA] = useState("");
    const [detailGroup, setDetailGroup] = useState<any>(null);

    const filtered = groups.filter(
        (g: any) =>
            g.projectgroupname.toLowerCase().includes(search.toLowerCase()) ||
            g.projecttitle.toLowerCase().includes(search.toLowerCase())
    );

    async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault();
        setLoading(true);
        const formData = new FormData(e.currentTarget);

        const result = editItem
            ? await updateProjectGroup(editItem.projectgroupid, formData)
            : await createProjectGroup(formData);

        if (result.success) {
            addToast({ title: result.message, variant: "success" });
            setDialogOpen(false);
            setEditItem(null);
            router.refresh();
        } else {
            addToast({
                title: result.message,
                description: result.errors ? Object.values(result.errors).flat().join(". ") : undefined,
                variant: "destructive",
            });
        }
        setLoading(false);
    }

    async function handleDelete(id: number) {
        setLoading(true);
        const result = await deleteProjectGroup(id);
        if (result.success) {
            addToast({ title: result.message, variant: "success" });
            router.refresh();
        } else {
            addToast({ title: result.message, variant: "destructive" });
        }
        setDeleteConfirm(null);
        setLoading(false);
    }

    async function handleAddMember() {
        if (!memberDialog || !selectedStudent) return;
        setLoading(true);
        const result = await addGroupMember(
            memberDialog.projectgroupid,
            parseInt(selectedStudent),
            0,
            memberCGPA ? parseFloat(memberCGPA) : undefined
        );
        if (result.success) {
            addToast({ title: result.message, variant: "success" });
            setSelectedStudent("");
            setMemberCGPA("");
            router.refresh();
        } else {
            addToast({ title: result.message, variant: "destructive" });
        }
        setLoading(false);
    }

    async function handleRemoveMember(memberId: number) {
        setLoading(true);
        const result = await removeGroupMember(memberId);
        if (result.success) {
            addToast({ title: result.message, variant: "success" });
            router.refresh();
        } else {
            addToast({ title: result.message, variant: "destructive" });
        }
        setLoading(false);
    }

    async function handleSetLeader(memberId: number, groupId: number) {
        setLoading(true);
        const result = await setGroupLeader(memberId, groupId);
        if (result.success) {
            addToast({ title: result.message, variant: "success" });
            router.refresh();
        } else {
            addToast({ title: result.message, variant: "destructive" });
        }
        setLoading(false);
    }

    async function handleStatusChange(groupId: number, status: string) {
        setLoading(true);
        const result = await updateGroupStatus(groupId, status);
        if (result.success) {
            addToast({ title: result.message, variant: "success" });
            router.refresh();
        } else {
            addToast({ title: result.message, variant: "destructive" });
        }
        setLoading(false);
    }

    const statusIcon = (status: string) => {
        switch (status) {
            case "approved": return <CheckCircle className="w-3.5 h-3.5" />;
            case "rejected": return <XCircle className="w-3.5 h-3.5" />;
            default: return <Clock className="w-3.5 h-3.5" />;
        }
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-zinc-900 tracking-tight">Project Groups</h1>
                    <p className="text-zinc-500 text-sm mt-1">Manage projects, assign guides, and track progress</p>
                </div>
                <Dialog
                    open={dialogOpen}
                    onOpenChange={(open) => { setDialogOpen(open); if (!open) setEditItem(null); }}
                >
                    <DialogTrigger asChild>
                        <Button><Plus className="w-4 h-4 mr-2" />Create Group</Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                        <DialogHeader>
                            <DialogTitle>{editItem ? "Edit" : "Create"} Project Group</DialogTitle>
                            <DialogDescription>
                                {editItem ? "Update the project group details" : "Set up a new project group"}
                            </DialogDescription>
                        </DialogHeader>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="projectgroupname">Group Name *</Label>
                                    <Input id="projectgroupname" name="projectgroupname" defaultValue={editItem?.projectgroupname || ""} required placeholder="e.g., Group A" />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="projecttypeid">Project Type *</Label>
                                    <Select id="projecttypeid" name="projecttypeid" defaultValue={editItem?.projecttypeid?.toString() || ""} required>
                                        <option value="">Select type</option>
                                        {projectTypes.map((pt: any) => (
                                            <option key={pt.projecttypeid} value={pt.projecttypeid}>{pt.projecttypename}</option>
                                        ))}
                                    </Select>
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="projecttitle">Project Title *</Label>
                                <Input id="projecttitle" name="projecttitle" defaultValue={editItem?.projecttitle || ""} required placeholder="Full project title" />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="projectarea">Project Area</Label>
                                <Input id="projectarea" name="projectarea" defaultValue={editItem?.projectarea || ""} placeholder="e.g., Machine Learning, Web Dev" />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="projectdescription">Project Description</Label>
                                <Textarea id="projectdescription" name="projectdescription" defaultValue={editItem?.projectdescription || ""} rows={3} placeholder="Detailed project description" />
                            </div>
                            <div className="grid grid-cols-3 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="guidestaffid">Guide</Label>
                                    <Select id="guidestaffid" name="guidestaffid" defaultValue={editItem?.guidestaffid?.toString() || ""}>
                                        <option value="">Select guide</option>
                                        {staff.map((s: any) => (<option key={s.staffid} value={s.staffid}>{s.staffname}</option>))}
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="convenerstaffid">Convener</Label>
                                    <Select id="convenerstaffid" name="convenerstaffid" defaultValue={editItem?.convenerstaffid?.toString() || ""}>
                                        <option value="">Select convener</option>
                                        {staff.map((s: any) => (<option key={s.staffid} value={s.staffid}>{s.staffname}</option>))}
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="expertstaffid">Expert</Label>
                                    <Select id="expertstaffid" name="expertstaffid" defaultValue={editItem?.expertstaffid?.toString() || ""}>
                                        <option value="">Select expert</option>
                                        {staff.map((s: any) => (<option key={s.staffid} value={s.staffid}>{s.staffname}</option>))}
                                    </Select>
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="description">Notes</Label>
                                <Textarea id="description" name="description" defaultValue={editItem?.description || ""} rows={2} placeholder="Additional notes" />
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

            {/* Search */}
            <div className="relative w-full max-w-sm">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                <Input placeholder="Search groups..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
            </div>

            {/* Groups Grid */}
            {filtered.length === 0 ? (
                <Card>
                    <CardContent className="py-12 text-center text-zinc-400">
                        {search ? "No matching project groups" : "No project groups yet. Create one to get started."}
                    </CardContent>
                </Card>
            ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    {filtered.map((g: any) => (
                        <Card key={g.projectgroupid} className="hover:shadow-md transition-all duration-200">
                            <CardHeader className="pb-3">
                                <div className="flex items-start justify-between">
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2">
                                            <CardTitle className="text-base truncate">{g.projecttitle}</CardTitle>
                                        </div>
                                        <CardDescription className="mt-1">{g.projectgroupname}</CardDescription>
                                    </div>
                                    <Badge variant={g.status === "approved" ? "success" : g.status === "rejected" ? "destructive" : "warning"} className="flex items-center gap-1 shrink-0">
                                        {statusIcon(g.status || "pending")}
                                        {g.status || "pending"}
                                    </Badge>
                                </div>
                            </CardHeader>
                            <CardContent className="space-y-3">
                                {/* Info */}
                                <div className="grid grid-cols-2 gap-2 text-sm">
                                    <div><span className="text-zinc-500">Type:</span> <span className="font-medium">{g.projecttype?.projecttypename || "—"}</span></div>
                                    <div><span className="text-zinc-500">Area:</span> <span className="font-medium">{g.projectarea || "—"}</span></div>
                                    <div><span className="text-zinc-500">Guide:</span> <span className="font-medium">{g.staff_projectgroup_guidestaffidTostaff?.staffname || "—"}</span></div>
                                    <div><span className="text-zinc-500">Members:</span> <span className="font-medium">{g._count.projectgroupmember}</span></div>
                                </div>

                                {/* Members list */}
                                {g.projectgroupmember.length > 0 && (
                                    <div className="flex flex-wrap gap-1.5">
                                        {g.projectgroupmember.map((m: any) => (
                                            <Badge key={m.projectgroupmemberid} variant={m.isgroupleader ? "default" : "secondary"} className="text-xs">
                                                {m.isgroupleader ? <Crown className="w-3 h-3 mr-1" /> : null}
                                                {m.student.studentname}
                                            </Badge>
                                        ))}
                                    </div>
                                )}

                                {/* Actions */}
                                <div className="flex items-center gap-1 pt-2 border-t border-zinc-100">
                                    <Button variant="ghost" size="sm" onClick={() => setDetailGroup(g)}>
                                        <Eye className="w-4 h-4 mr-1" />Details
                                    </Button>
                                    <Button variant="ghost" size="sm" onClick={() => setMemberDialog(g)}>
                                        <UserPlus className="w-4 h-4 mr-1" />Members
                                    </Button>
                                    <Button variant="ghost" size="sm" onClick={() => { setEditItem(g); setDialogOpen(true); }}>
                                        <Pencil className="w-4 h-4 mr-1" />Edit
                                    </Button>
                                    {deleteConfirm === g.projectgroupid ? (
                                        <div className="flex items-center gap-1 ml-auto">
                                            <Button variant="destructive" size="sm" onClick={() => handleDelete(g.projectgroupid)} disabled={loading}>Delete</Button>
                                            <Button variant="ghost" size="sm" onClick={() => setDeleteConfirm(null)}>Cancel</Button>
                                        </div>
                                    ) : (
                                        <Button variant="ghost" size="sm" onClick={() => setDeleteConfirm(g.projectgroupid)} className="ml-auto">
                                            <Trash2 className="w-4 h-4 text-red-500" />
                                        </Button>
                                    )}
                                </div>

                                {/* Status actions */}
                                {(g.status === "pending" || !g.status) && (
                                    <div className="flex items-center gap-2 pt-2 border-t border-zinc-100">
                                        <span className="text-xs text-zinc-500">Actions:</span>
                                        <Button size="sm" variant="outline" className="text-emerald-600 border-emerald-200 hover:bg-emerald-50" onClick={() => handleStatusChange(g.projectgroupid, "approved")}>
                                            <CheckCircle className="w-3.5 h-3.5 mr-1" />Approve
                                        </Button>
                                        <Button size="sm" variant="outline" className="text-red-600 border-red-200 hover:bg-red-50" onClick={() => handleStatusChange(g.projectgroupid, "rejected")}>
                                            <XCircle className="w-3.5 h-3.5 mr-1" />Reject
                                        </Button>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}

            {/* Member Management Dialog */}
            <Dialog open={!!memberDialog} onOpenChange={(open) => { if (!open) setMemberDialog(null); }}>
                <DialogContent className="max-w-lg">
                    <DialogHeader>
                        <DialogTitle>Manage Members — {memberDialog?.projectgroupname}</DialogTitle>
                        <DialogDescription>Add or remove students from this group</DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                        {/* Add member */}
                        <div className="flex gap-2">
                            <Select value={selectedStudent} onChange={(e) => setSelectedStudent(e.target.value)} className="flex-1">
                                <option value="">Select student</option>
                                {students
                                    .filter((s: any) => !memberDialog?.projectgroupmember.some((m: any) => m.studentid === s.studentid))
                                    .map((s: any) => (
                                        <option key={s.studentid} value={s.studentid}>{s.studentname}</option>
                                    ))}
                            </Select>
                            <Input placeholder="CGPA" value={memberCGPA} onChange={(e) => setMemberCGPA(e.target.value)} className="w-20" type="number" step="0.01" min="0" max="10" />
                            <Button onClick={handleAddMember} disabled={!selectedStudent || loading} size="sm">
                                <UserPlus className="w-4 h-4" />
                            </Button>
                        </div>

                        {/* Current members */}
                        <div className="space-y-2">
                            {memberDialog?.projectgroupmember.map((m: any) => (
                                <div key={m.projectgroupmemberid} className="flex items-center justify-between p-2.5 rounded-lg bg-zinc-50 border border-zinc-100">
                                    <div className="flex items-center gap-2">
                                        <div className="w-7 h-7 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-xs font-medium">
                                            {m.student.studentname.charAt(0)}
                                        </div>
                                        <div>
                                            <span className="text-sm font-medium">{m.student.studentname}</span>
                                            {m.studentcgpa && <span className="text-xs text-zinc-500 ml-2">CGPA: {Number(m.studentcgpa).toFixed(2)}</span>}
                                        </div>
                                        {m.isgroupleader === 1 && <Badge variant="default" className="text-[10px]"><Crown className="w-3 h-3 mr-0.5" />Leader</Badge>}
                                    </div>
                                    <div className="flex items-center gap-1">
                                        {m.isgroupleader !== 1 && (
                                            <Button variant="ghost" size="sm" onClick={() => handleSetLeader(m.projectgroupmemberid, memberDialog.projectgroupid)} disabled={loading} className="text-xs">
                                                <Crown className="w-3.5 h-3.5 mr-1" />Make Leader
                                            </Button>
                                        )}
                                        <Button variant="ghost" size="icon" onClick={() => handleRemoveMember(m.projectgroupmemberid)} disabled={loading} className="h-7 w-7">
                                            <X className="w-3.5 h-3.5 text-red-500" />
                                        </Button>
                                    </div>
                                </div>
                            ))}
                            {memberDialog?.projectgroupmember.length === 0 && (
                                <p className="text-sm text-zinc-400 text-center py-4">No members yet</p>
                            )}
                        </div>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Detail Dialog */}
            <Dialog open={!!detailGroup} onOpenChange={(open) => { if (!open) setDetailGroup(null); }}>
                <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>{detailGroup?.projecttitle}</DialogTitle>
                        <DialogDescription>{detailGroup?.projectgroupname}</DialogDescription>
                    </DialogHeader>
                    {detailGroup && (
                        <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-3 text-sm">
                                <div><span className="text-zinc-500">Type:</span> <span className="font-medium">{detailGroup.projecttype?.projecttypename}</span></div>
                                <div><span className="text-zinc-500">Area:</span> <span className="font-medium">{detailGroup.projectarea || "—"}</span></div>
                                <div><span className="text-zinc-500">Guide:</span> <span className="font-medium">{detailGroup.staff_projectgroup_guidestaffidTostaff?.staffname || "—"}</span></div>
                                <div><span className="text-zinc-500">Convener:</span> <span className="font-medium">{detailGroup.staff_projectgroup_convenerstaffidTostaff?.staffname || "—"}</span></div>
                                <div><span className="text-zinc-500">Expert:</span> <span className="font-medium">{detailGroup.staff_projectgroup_expertstaffidTostaff?.staffname || "—"}</span></div>
                                <div><span className="text-zinc-500">Avg CPI:</span> <span className="font-medium">{detailGroup.averagecpi ? Number(detailGroup.averagecpi).toFixed(2) : "—"}</span></div>
                                <div><span className="text-zinc-500">Status:</span> <Badge variant={detailGroup.status === "approved" ? "success" : detailGroup.status === "rejected" ? "destructive" : "warning"}>{detailGroup.status || "pending"}</Badge></div>
                                <div><span className="text-zinc-500">Meetings:</span> <span className="font-medium">{detailGroup._count.projectmeeting}</span></div>
                            </div>
                            {detailGroup.projectdescription && (
                                <div>
                                    <p className="text-sm text-zinc-500 mb-1">Description:</p>
                                    <p className="text-sm bg-zinc-50 rounded-lg p-3">{detailGroup.projectdescription}</p>
                                </div>
                            )}
                            <div className="flex gap-2 pt-2 border-t border-zinc-100">
                                <Link href={`/dashboard/meetings?group=${detailGroup.projectgroupid}`}>
                                    <Button variant="outline" size="sm">View Meetings</Button>
                                </Link>
                            </div>
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    );
}
