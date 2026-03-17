import { z } from "zod";

// Auth schemas
export const loginSchema = z.object({
    email: z.string().email("Invalid email address"),
    password: z.string().min(1, "Password is required"),
    role: z.enum(["admin", "faculty", "student"]),
});

export const adminRegisterSchema = z.object({
    username: z.string().min(1, "Username is required").max(100),
    email: z.string().email("Invalid email address"),
    password: z.string().min(6, "Password must be at least 6 characters"),
    confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
});

// Project Type schemas
export const projectTypeSchema = z.object({
    projecttypename: z
        .string()
        .min(1, "Project type name is required")
        .max(100, "Maximum 100 characters"),
    description: z.string().optional(),
});

// Staff schemas
export const staffSchema = z.object({
    staffname: z
        .string()
        .min(1, "Staff name is required")
        .max(200, "Maximum 200 characters"),
    phone: z.string().max(20, "Maximum 20 characters").optional().or(z.literal("")),
    email: z.string().email("Invalid email").max(100).optional().or(z.literal("")),
    password: z.string().min(6, "Minimum 6 characters"),
    description: z.string().optional(),
});

export const staffUpdateSchema = staffSchema.omit({ password: true }).extend({
    password: z.string().min(6, "Minimum 6 characters").optional().or(z.literal("")),
});

// Student schemas
export const studentSchema = z.object({
    studentname: z
        .string()
        .min(1, "Student name is required")
        .max(200, "Maximum 200 characters"),
    phone: z.string().max(20, "Maximum 20 characters").optional().or(z.literal("")),
    email: z.string().email("Invalid email").max(100).optional().or(z.literal("")),
    password: z.string().min(6, "Minimum 6 characters"),
    description: z.string().optional(),
});

export const studentUpdateSchema = studentSchema.omit({ password: true }).extend({
    password: z.string().min(6, "Minimum 6 characters").optional().or(z.literal("")),
});

// Project Group schemas
export const projectGroupSchema = z.object({
    projectgroupname: z
        .string()
        .min(1, "Group name is required")
        .max(200, "Maximum 200 characters"),
    projecttypeid: z.coerce.number().int().positive("Select a project type"),
    guidestaffid: z.coerce.number().int().positive("Select a guide").optional().nullable(),
    projecttitle: z
        .string()
        .min(1, "Project title is required")
        .max(500, "Maximum 500 characters"),
    projectarea: z.string().max(200, "Maximum 200 characters").optional().or(z.literal("")),
    projectdescription: z.string().optional(),
    convenerstaffid: z.coerce.number().int().positive().optional().nullable(),
    expertstaffid: z.coerce.number().int().positive().optional().nullable(),
    description: z.string().optional(),
});

// Project Group Member schemas
export const projectGroupMemberSchema = z.object({
    projectgroupid: z.coerce.number().int().positive("Select a project group"),
    studentid: z.coerce.number().int().positive("Select a student"),
    isgroupleader: z.coerce.number().int().min(0).max(1).default(0),
    studentcgpa: z.coerce.number().min(0).max(10).optional().nullable(),
    description: z.string().optional(),
});

// Meeting schemas
export const meetingSchema = z.object({
    projectgroupid: z.coerce.number().int().positive("Select a project group"),
    guidestaffid: z.coerce.number().int().positive().optional().nullable(),
    meetingdatetime: z.string().min(1, "Meeting date/time is required"),
    meetingpurpose: z.string().min(1, "Meeting purpose is required"),
    meetinglocation: z.string().max(200, "Maximum 200 characters").optional().or(z.literal("")),
    description: z.string().optional(),
});

export const meetingEntrySchema = z.object({
    meetingnotes: z.string().optional(),
    meetingstatus: z.enum(["Scheduled", "Completed", "Cancelled"]),
    meetingstatusdescription: z.string().optional(),
});

// Meeting Attendance schemas
export const meetingAttendanceSchema = z.object({
    projectmeetingid: z.coerce.number().int().positive(),
    studentid: z.coerce.number().int().positive(),
    ispresent: z.coerce.number().int().min(0).max(1).default(1),
    attendanceremarks: z.string().optional(),
});

export type LoginFormData = z.infer<typeof loginSchema>;
export type ProjectTypeFormData = z.infer<typeof projectTypeSchema>;
export type StaffFormData = z.infer<typeof staffSchema>;
export type StaffUpdateFormData = z.infer<typeof staffUpdateSchema>;
export type StudentFormData = z.infer<typeof studentSchema>;
export type StudentUpdateFormData = z.infer<typeof studentUpdateSchema>;
export type ProjectGroupFormData = z.infer<typeof projectGroupSchema>;
export type ProjectGroupMemberFormData = z.infer<typeof projectGroupMemberSchema>;
export type MeetingFormData = z.infer<typeof meetingSchema>;
export type MeetingEntryFormData = z.infer<typeof meetingEntrySchema>;
export type MeetingAttendanceFormData = z.infer<typeof meetingAttendanceSchema>;
export type AdminRegisterFormData = z.infer<typeof adminRegisterSchema>;
