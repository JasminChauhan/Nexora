"use client";

import { useState } from "react";
import {
    createMeeting,
    updateMeetingEntry,
    deleteMeeting,
    saveAttendance,
    getMeetingById,
} from "@/actions/meetings";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
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
    Trash2,
    Calendar,
    Loader2,
    Search,
    FileText,
    CheckSquare,
    MapPin,
    Clock,
    Users,
} from "lucide-react";
import { useRouter } from "next/navigation";

/* eslint-disable @typescript-eslint/no-explicit-any */

export function MeetingsClient({
    meetings,
    groups,
    staff,
    userRole = "student",
}: {
    meetings: any[];
    groups: any[];
    staff: any[];
    userRole?: string;
}) {
    const canManage = userRole === "admin" || userRole === "faculty";
    const router = useRouter();
    const { addToast } = useToast();
    const [dialogOpen, setDialogOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [deleteConfirm, setDeleteConfirm] = useState<number | null>(null);
    const [search, setSearch] = useState("");
    const [entryDialog, setEntryDialog] = useState<any>(null);
    const [attendanceDialog, setAttendanceDialog] = useState<any>(null);
    const [attendanceData, setAttendanceData] = useState<
        { studentid: number; studentname: string; ispresent: number; attendanceremarks: string }[]
    >([]);

    const filtered = meetings.filter(
        (m: any) =>
            m.meetingpurpose?.toLowerCase().includes(search.toLowerCase()) ||
            m.projectgroup?.projectgroupname?.toLowerCase().includes(search.toLowerCase()) ||
            m.meetinglocation?.toLowerCase().includes(search.toLowerCase())
    );

    async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault();
        setLoading(true);
        const formData = new FormData(e.currentTarget);
        const result = await createMeeting(formData);
        if (result.success) {
            addToast({ title: result.message, variant: "success" });
            setDialogOpen(false);
            router.refresh();
        } else {
            addToast({ title: result.message, variant: "destructive" });
        }
        setLoading(false);
    }

    async function handleEntrySubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault();
        setLoading(true);
        const formData = new FormData(e.currentTarget);
        const result = await updateMeetingEntry(entryDialog.projectmeetingid, formData);
        if (result.success) {
            addToast({ title: result.message, variant: "success" });
            setEntryDialog(null);
            router.refresh();
        } else {
            addToast({ title: result.message, variant: "destructive" });
        }
        setLoading(false);
    }

    async function handleDelete(id: number) {
        setLoading(true);
        const result = await deleteMeeting(id);
        if (result.success) {
            addToast({ title: result.message, variant: "success" });
            router.refresh();
        } else {
            addToast({ title: result.message, variant: "destructive" });
        }
        setDeleteConfirm(null);
        setLoading(false);
    }

    async function openAttendance(meetingId: number) {
        setLoading(true);
        const meeting = await getMeetingById(meetingId);
        if (!meeting) {
            addToast({ title: "Meeting not found", variant: "destructive" });
            setLoading(false);
            return;
        }

        // Get all members of the group
        const members = meeting.projectgroup.projectgroupmember;
        const existingAttendance = meeting.projectmeetingattendance;

        const data = members.map((m: any) => {
            const existing = existingAttendance.find((a: any) => a.studentid === m.studentid);
            return {
                studentid: m.studentid,
                studentname: m.student.studentname,
                ispresent: existing ? existing.ispresent ?? 1 : 1,
                attendanceremarks: existing?.attendanceremarks || "",
            };
        });

        setAttendanceData(data);
        setAttendanceDialog(meeting);
        setLoading(false);
    }

    async function handleSaveAttendance() {
        if (!attendanceDialog) return;
        setLoading(true);
        const result = await saveAttendance(
            attendanceDialog.projectmeetingid,
            attendanceData.map((a) => ({
                studentid: a.studentid,
                ispresent: a.ispresent,
                attendanceremarks: a.attendanceremarks,
            }))
        );
        if (result.success) {
            addToast({ title: result.message, variant: "success" });
            setAttendanceDialog(null);
            router.refresh();
        } else {
            addToast({ title: result.message, variant: "destructive" });
        }
        setLoading(false);
    }

    const statusColor = (status: string) => {
        switch (status) {
            case "Completed": return "success";
            case "Cancelled": return "destructive";
            default: return "warning";
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-zinc-900 tracking-tight">Meetings</h1>
                    <p className="text-zinc-500 text-sm mt-1">Schedule, track, and manage project meetings</p>
                </div>
                {canManage && (
                    <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                        <DialogTrigger asChild>
                            <Button><Plus className="w-4 h-4 mr-2" />Schedule Meeting</Button>
                        </DialogTrigger>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>Schedule Meeting</DialogTitle>
                                <DialogDescription>Create a new project meeting</DialogDescription>
                            </DialogHeader>
                            <form onSubmit={handleSubmit} className="space-y-4">
                                <div className="space-y-2">
                                    <Label htmlFor="projectgroupid">Project Group *</Label>
                                    <Select id="projectgroupid" name="projectgroupid" required>
                                        <option value="">Select group</option>
                                        {groups.map((g: any) => (
                                            <option key={g.projectgroupid} value={g.projectgroupid}>{g.projectgroupname} — {g.projecttitle}</option>
                                        ))}
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="guidestaffid">Guide</Label>
                                    <Select id="guidestaffid" name="guidestaffid">
                                        <option value="">Select guide</option>
                                        {staff.map((s: any) => (
                                            <option key={s.staffid} value={s.staffid}>{s.staffname}</option>
                                        ))}
                                    </Select>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="meetingdatetime">Date & Time *</Label>
                                        <Input id="meetingdatetime" name="meetingdatetime" type="datetime-local" required />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="meetinglocation">Location</Label>
                                        <Input id="meetinglocation" name="meetinglocation" placeholder="Room, lab, online link" />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="meetingpurpose">Purpose *</Label>
                                    <Textarea id="meetingpurpose" name="meetingpurpose" required placeholder="What is the meeting about?" rows={2} />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="description">Notes</Label>
                                    <Textarea id="description" name="description" placeholder="Additional notes" rows={2} />
                                </div>
                                <DialogFooter>
                                    <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
                                    <Button type="submit" disabled={loading}>
                                        {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                                        Schedule
                                    </Button>
                                </DialogFooter>
                            </form>
                        </DialogContent>
                    </Dialog>
                )}
            </div>

            <Card>
                <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                        <CardTitle className="text-base flex items-center gap-2">
                            <Calendar className="w-4 h-4" />All Meetings ({filtered.length})
                        </CardTitle>
                        <div className="relative w-64">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                            <Input placeholder="Search meetings..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9 h-9" />
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="p-0">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Group / Project</TableHead>
                                <TableHead>Purpose</TableHead>
                                <TableHead>Date & Time</TableHead>
                                <TableHead>Location</TableHead>
                                <TableHead className="text-center">Status</TableHead>
                                {canManage && <TableHead className="text-right">Actions</TableHead>}
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {filtered.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={6} className="text-center text-zinc-400 py-12">
                                        {search ? "No matching meetings" : "No meetings scheduled yet"}
                                    </TableCell>
                                </TableRow>
                            ) : (
                                filtered.map((m: any) => (
                                    <TableRow key={m.projectmeetingid}>
                                        <TableCell>
                                            <div>
                                                <p className="font-medium text-sm">{m.projectgroup?.projectgroupname}</p>
                                                <p className="text-xs text-zinc-500 truncate max-w-[200px]">{m.projectgroup?.projecttitle}</p>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <p className="text-sm max-w-[200px] truncate">{m.meetingpurpose || "—"}</p>
                                            {m.staff && <p className="text-xs text-zinc-500">Guide: {m.staff.staffname}</p>}
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-1.5 text-sm">
                                                <Clock className="w-3.5 h-3.5 text-zinc-400" />
                                                <div>
                                                    <p>{new Date(m.meetingdatetime).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}</p>
                                                    <p className="text-xs text-zinc-500">{new Date(m.meetingdatetime).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}</p>
                                                </div>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            {m.meetinglocation ? (
                                                <div className="flex items-center gap-1 text-sm text-zinc-600">
                                                    <MapPin className="w-3.5 h-3.5" />{m.meetinglocation}
                                                </div>
                                            ) : "—"}
                                        </TableCell>
                                        <TableCell className="text-center">
                                            <Badge variant={statusColor(m.meetingstatus || "Scheduled") as any}>
                                                {m.meetingstatus || "Scheduled"}
                                            </Badge>
                                        </TableCell>
                                        {canManage && (
                                            <TableCell className="text-right">
                                                <div className="flex items-center justify-end gap-1">
                                                    <Button variant="ghost" size="sm" onClick={() => setEntryDialog(m)} title="Record">
                                                        <FileText className="w-4 h-4" />
                                                    </Button>
                                                    <Button variant="ghost" size="sm" onClick={() => openAttendance(m.projectmeetingid)} title="Attendance">
                                                        <CheckSquare className="w-4 h-4" />
                                                    </Button>
                                                    {deleteConfirm === m.projectmeetingid ? (
                                                        <div className="flex items-center gap-1">
                                                            <Button variant="destructive" size="sm" onClick={() => handleDelete(m.projectmeetingid)} disabled={loading}>Confirm</Button>
                                                            <Button variant="ghost" size="sm" onClick={() => setDeleteConfirm(null)}>Cancel</Button>
                                                        </div>
                                                    ) : (
                                                        <Button variant="ghost" size="icon" onClick={() => setDeleteConfirm(m.projectmeetingid)}>
                                                            <Trash2 className="w-4 h-4 text-red-500" />
                                                        </Button>
                                                    )}
                                                </div>
                                            </TableCell>
                                        )}
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>

            {/* Meeting Entry Dialog */}
            <Dialog open={!!entryDialog} onOpenChange={(open) => { if (!open) setEntryDialog(null); }}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Meeting Record</DialogTitle>
                        <DialogDescription>
                            {entryDialog?.projectgroup?.projectgroupname} — {new Date(entryDialog?.meetingdatetime).toLocaleDateString("en-IN")}
                        </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleEntrySubmit} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="meetingstatus">Status *</Label>
                            <Select id="meetingstatus" name="meetingstatus" defaultValue={entryDialog?.meetingstatus || "Scheduled"} required>
                                <option value="Scheduled">Scheduled</option>
                                <option value="Completed">Completed</option>
                                <option value="Cancelled">Cancelled</option>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="meetingnotes">Meeting Notes</Label>
                            <Textarea id="meetingnotes" name="meetingnotes" defaultValue={entryDialog?.meetingnotes || ""} rows={4} placeholder="Key discussion points, decisions, action items..." />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="meetingstatusdescription">Feedback</Label>
                            <Textarea id="meetingstatusdescription" name="meetingstatusdescription" defaultValue={entryDialog?.meetingstatusdescription || ""} rows={2} placeholder="Guide feedback or comments" />
                        </div>
                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={() => setEntryDialog(null)}>Cancel</Button>
                            <Button type="submit" disabled={loading}>
                                {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                                Save
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* Attendance Dialog */}
            <Dialog open={!!attendanceDialog} onOpenChange={(open) => { if (!open) setAttendanceDialog(null); }}>
                <DialogContent className="max-w-lg">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <Users className="w-5 h-5" />Attendance
                        </DialogTitle>
                        <DialogDescription>
                            {attendanceDialog?.projectgroup?.projectgroupmember?.length || 0} group members
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-3">
                        {attendanceData.length === 0 ? (
                            <p className="text-sm text-zinc-400 text-center py-4">No group members found. Add members to the group first.</p>
                        ) : (
                            attendanceData.map((a, i) => (
                                <div key={a.studentid} className="flex items-center gap-3 p-3 rounded-lg bg-zinc-50 border border-zinc-100">
                                    <button
                                        type="button"
                                        onClick={() => {
                                            const updated = [...attendanceData];
                                            updated[i].ispresent = updated[i].ispresent === 1 ? 0 : 1;
                                            setAttendanceData(updated);
                                        }}
                                        className={`w-6 h-6 rounded-md border-2 flex items-center justify-center transition-colors cursor-pointer ${a.ispresent === 1
                                            ? "bg-emerald-500 border-emerald-500 text-white"
                                            : "border-zinc-300 bg-white"
                                            }`}
                                    >
                                        {a.ispresent === 1 && <CheckSquare className="w-4 h-4" />}
                                    </button>
                                    <div className="flex-1">
                                        <p className="text-sm font-medium">{a.studentname}</p>
                                    </div>
                                    <Input
                                        placeholder="Remarks"
                                        value={a.attendanceremarks}
                                        onChange={(e) => {
                                            const updated = [...attendanceData];
                                            updated[i].attendanceremarks = e.target.value;
                                            setAttendanceData(updated);
                                        }}
                                        className="w-32 h-8 text-xs"
                                    />
                                    <Badge variant={a.ispresent === 1 ? "success" : "destructive"} className="w-16 justify-center">
                                        {a.ispresent === 1 ? "Present" : "Absent"}
                                    </Badge>
                                </div>
                            ))
                        )}
                    </div>
                    {attendanceData.length > 0 && (
                        <DialogFooter>
                            <div className="flex items-center justify-between w-full">
                                <p className="text-sm text-zinc-500">
                                    {attendanceData.filter((a) => a.ispresent === 1).length}/{attendanceData.length} present
                                </p>
                                <div className="flex gap-2">
                                    <Button variant="outline" onClick={() => setAttendanceDialog(null)}>Cancel</Button>
                                    <Button onClick={handleSaveAttendance} disabled={loading}>
                                        {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                                        Save Attendance
                                    </Button>
                                </div>
                            </div>
                        </DialogFooter>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    );
}
