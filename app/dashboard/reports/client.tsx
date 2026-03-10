"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
    BarChart3,
    Download,
    Search,
    FileText,
    Users,
    Calendar,
    FolderKanban,
} from "lucide-react";

/* eslint-disable @typescript-eslint/no-explicit-any */

export function ReportsClient({
    projectGroups,
    meetings,
    students,
    staff,
}: {
    projectGroups: any[];
    meetings: any[];
    students: any[];
    staff: any[];
}) {
    const [search, setSearch] = useState("");

    function exportCSV(headers: string[], rows: string[][], filename: string) {
        const csvContent = [
            headers.join(","),
            ...rows.map((row) =>
                row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(",")
            ),
        ].join("\n");

        const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
        const link = document.createElement("a");
        link.href = URL.createObjectURL(blob);
        link.download = `${filename}.csv`;
        link.click();
    }

    function exportProjectsList() {
        exportCSV(
            ["Group Name", "Project Title", "Type", "Area", "Guide", "Members", "Status"],
            projectGroups.map((g) => [
                g.projectgroupname,
                g.projecttitle,
                g.projecttype?.projecttypename || "",
                g.projectarea || "",
                g.staff_projectgroup_guidestaffidTostaff?.staffname || "",
                g._count.projectgroupmember.toString(),
                g.status || "pending",
            ]),
            "projects_report"
        );
    }

    function exportProjectsByGuide() {
        const rows: string[][] = [];
        staff.forEach((s: any) => {
            const guideGroups = s.projectgroup_projectgroup_guidestaffidTostaff;
            if (guideGroups.length > 0) {
                guideGroups.forEach((g: any) => {
                    rows.push([s.staffname, s.email || "", g.projectgroupname, g.projecttitle]);
                });
            }
        });
        exportCSV(["Guide", "Email", "Group", "Project Title"], rows, "projects_by_guide");
    }

    function exportStudentMembers() {
        const rows: string[][] = [];
        students.forEach((s: any) => {
            if (s.projectgroupmember.length > 0) {
                s.projectgroupmember.forEach((m: any) => {
                    rows.push([s.studentname, s.email || "", m.projectgroup.projectgroupname, m.projectgroup.projecttitle]);
                });
            } else {
                rows.push([s.studentname, s.email || "", "Unassigned", ""]);
            }
        });
        exportCSV(["Student", "Email", "Group", "Project"], rows, "student_members");
    }

    function exportMeetingAttendance() {
        const rows: string[][] = [];
        meetings.forEach((m: any) => {
            m.projectmeetingattendance.forEach((a: any) => {
                rows.push([
                    m.projectgroup?.projectgroupname || "",
                    new Date(m.meetingdatetime).toLocaleDateString("en-IN"),
                    m.meetingpurpose || "",
                    a.student.studentname,
                    a.ispresent === 1 ? "Present" : "Absent",
                    a.attendanceremarks || "",
                ]);
            });
        });
        exportCSV(["Group", "Date", "Purpose", "Student", "Status", "Remarks"], rows, "meeting_attendance");
    }

    // Computed data for tabs
    const guideMap = new Map<string, { staffname: string; groups: any[] }>();
    staff.forEach((s: any) => {
        if (s.projectgroup_projectgroup_guidestaffidTostaff.length > 0) {
            guideMap.set(s.staffname, {
                staffname: s.staffname,
                groups: s.projectgroup_projectgroup_guidestaffidTostaff,
            });
        }
    });

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-zinc-900 tracking-tight">Reports</h1>
                    <p className="text-zinc-500 text-sm mt-1">Generate and export system reports</p>
                </div>
            </div>

            {/* Quick stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Card>
                    <CardContent className="p-4 flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center">
                            <FolderKanban className="w-5 h-5 text-blue-600" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold">{projectGroups.length}</p>
                            <p className="text-xs text-zinc-500">Projects</p>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="p-4 flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-emerald-50 flex items-center justify-center">
                            <Users className="w-5 h-5 text-emerald-600" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold">{students.length}</p>
                            <p className="text-xs text-zinc-500">Students</p>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="p-4 flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-purple-50 flex items-center justify-center">
                            <Calendar className="w-5 h-5 text-purple-600" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold">{meetings.length}</p>
                            <p className="text-xs text-zinc-500">Meetings</p>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="p-4 flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-amber-50 flex items-center justify-center">
                            <BarChart3 className="w-5 h-5 text-amber-600" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold">{guideMap.size}</p>
                            <p className="text-xs text-zinc-500">Active Guides</p>
                        </div>
                    </CardContent>
                </Card>
            </div>

            <Tabs defaultValue="projects" className="space-y-4">
                <TabsList>
                    <TabsTrigger value="projects">Projects</TabsTrigger>
                    <TabsTrigger value="by-guide">By Guide</TabsTrigger>
                    <TabsTrigger value="students">Students</TabsTrigger>
                    <TabsTrigger value="attendance">Attendance</TabsTrigger>
                </TabsList>

                {/* Projects Report */}
                <TabsContent value="projects">
                    <Card>
                        <CardHeader className="pb-3">
                            <div className="flex items-center justify-between">
                                <div>
                                    <CardTitle className="text-base flex items-center gap-2">
                                        <FileText className="w-4 h-4" />Projects List
                                    </CardTitle>
                                    <CardDescription>All project groups with details</CardDescription>
                                </div>
                                <Button variant="outline" size="sm" onClick={exportProjectsList}>
                                    <Download className="w-4 h-4 mr-2" />Export CSV
                                </Button>
                            </div>
                        </CardHeader>
                        <CardContent className="p-0">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Group</TableHead>
                                        <TableHead>Title</TableHead>
                                        <TableHead>Type</TableHead>
                                        <TableHead>Guide</TableHead>
                                        <TableHead className="text-center">Members</TableHead>
                                        <TableHead className="text-center">Meetings</TableHead>
                                        <TableHead className="text-center">Status</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {projectGroups.map((g) => (
                                        <TableRow key={g.projectgroupid}>
                                            <TableCell className="font-medium">{g.projectgroupname}</TableCell>
                                            <TableCell className="max-w-[200px] truncate">{g.projecttitle}</TableCell>
                                            <TableCell>{g.projecttype?.projecttypename || "—"}</TableCell>
                                            <TableCell>{g.staff_projectgroup_guidestaffidTostaff?.staffname || "—"}</TableCell>
                                            <TableCell className="text-center">{g._count.projectgroupmember}</TableCell>
                                            <TableCell className="text-center">{g._count.projectmeeting}</TableCell>
                                            <TableCell className="text-center">
                                                <Badge variant={g.status === "approved" ? "success" : g.status === "rejected" ? "destructive" : "warning"}>
                                                    {g.status || "pending"}
                                                </Badge>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* By Guide */}
                <TabsContent value="by-guide">
                    <Card>
                        <CardHeader className="pb-3">
                            <div className="flex items-center justify-between">
                                <div>
                                    <CardTitle className="text-base">Projects by Guide</CardTitle>
                                    <CardDescription>Staff members and their assigned projects</CardDescription>
                                </div>
                                <Button variant="outline" size="sm" onClick={exportProjectsByGuide}>
                                    <Download className="w-4 h-4 mr-2" />Export CSV
                                </Button>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                {Array.from(guideMap.values()).map((guide) => (
                                    <div key={guide.staffname} className="border border-zinc-100 rounded-lg p-4">
                                        <h3 className="font-medium text-zinc-900 mb-2">{guide.staffname}</h3>
                                        <div className="space-y-1">
                                            {guide.groups.map((g: any, i: number) => (
                                                <div key={i} className="flex items-center gap-2 text-sm text-zinc-600">
                                                    <div className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                                                    <span className="font-medium">{g.projectgroupname}</span>
                                                    <span className="text-zinc-400">—</span>
                                                    <span>{g.projecttitle}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                ))}
                                {guideMap.size === 0 && (
                                    <p className="text-center text-zinc-400 py-6">No guides assigned yet</p>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Students */}
                <TabsContent value="students">
                    <Card>
                        <CardHeader className="pb-3">
                            <div className="flex items-center justify-between">
                                <div>
                                    <CardTitle className="text-base">Student Group Memberships</CardTitle>
                                    <CardDescription>All students and their group assignments</CardDescription>
                                </div>
                                <Button variant="outline" size="sm" onClick={exportStudentMembers}>
                                    <Download className="w-4 h-4 mr-2" />Export CSV
                                </Button>
                            </div>
                        </CardHeader>
                        <CardContent className="p-0">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Student</TableHead>
                                        <TableHead>Email</TableHead>
                                        <TableHead>Group(s)</TableHead>
                                        <TableHead>Project(s)</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {students.map((s: any) => (
                                        <TableRow key={s.studentid}>
                                            <TableCell className="font-medium">{s.studentname}</TableCell>
                                            <TableCell className="text-zinc-500">{s.email || "—"}</TableCell>
                                            <TableCell>
                                                {s.projectgroupmember.length > 0 ? (
                                                    <div className="flex flex-wrap gap-1">
                                                        {s.projectgroupmember.map((m: any, i: number) => (
                                                            <Badge key={i} variant="secondary" className="text-xs">{m.projectgroup.projectgroupname}</Badge>
                                                        ))}
                                                    </div>
                                                ) : <span className="text-zinc-400">Unassigned</span>}
                                            </TableCell>
                                            <TableCell className="text-zinc-500 max-w-[200px] truncate">
                                                {s.projectgroupmember.map((m: any) => m.projectgroup.projecttitle).join(", ") || "—"}
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Attendance */}
                <TabsContent value="attendance">
                    <Card>
                        <CardHeader className="pb-3">
                            <div className="flex items-center justify-between">
                                <div>
                                    <CardTitle className="text-base">Meeting Attendance</CardTitle>
                                    <CardDescription>Attendance records for all meetings</CardDescription>
                                </div>
                                <Button variant="outline" size="sm" onClick={exportMeetingAttendance}>
                                    <Download className="w-4 h-4 mr-2" />Export CSV
                                </Button>
                            </div>
                        </CardHeader>
                        <CardContent className="p-0">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Group</TableHead>
                                        <TableHead>Date</TableHead>
                                        <TableHead>Purpose</TableHead>
                                        <TableHead>Student</TableHead>
                                        <TableHead className="text-center">Status</TableHead>
                                        <TableHead>Remarks</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {meetings.flatMap((m: any) =>
                                        m.projectmeetingattendance.length > 0
                                            ? m.projectmeetingattendance.map((a: any) => (
                                                <TableRow key={`${m.projectmeetingid}-${a.studentid}`}>
                                                    <TableCell className="font-medium">{m.projectgroup?.projectgroupname}</TableCell>
                                                    <TableCell className="text-sm">
                                                        {new Date(m.meetingdatetime).toLocaleDateString("en-IN", {
                                                            day: "numeric", month: "short", year: "numeric",
                                                        })}
                                                    </TableCell>
                                                    <TableCell className="max-w-[150px] truncate">{m.meetingpurpose || "—"}</TableCell>
                                                    <TableCell>{a.student.studentname}</TableCell>
                                                    <TableCell className="text-center">
                                                        <Badge variant={a.ispresent === 1 ? "success" : "destructive"}>
                                                            {a.ispresent === 1 ? "Present" : "Absent"}
                                                        </Badge>
                                                    </TableCell>
                                                    <TableCell className="text-zinc-500 text-sm">{a.attendanceremarks || "—"}</TableCell>
                                                </TableRow>
                                            ))
                                            : []
                                    )}
                                    {meetings.every((m: any) => m.projectmeetingattendance.length === 0) && (
                                        <TableRow>
                                            <TableCell colSpan={6} className="text-center text-zinc-400 py-12">
                                                No attendance records yet
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
}
