import { z } from "zod";

export const uuid = z.uuid({ message: "Pick a valid option." });
const day = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Use a valid date.");
const optionalText = (max: number) =>
  z
    .string()
    .trim()
    .max(max, `Keep it under ${max} characters.`)
    .optional()
    .transform((v) => (v ? v : undefined));

export const registerSchema = z.object({
  fullName: z.string().trim().min(1, "Enter your full name.").max(120, "Keep your name under 120 characters."),
  email: z.email({ message: "Enter a valid work email." }).trim().toLowerCase(),
  password: z.string().min(6, "Use at least 6 characters.").max(72, "Use at most 72 characters."),
  department: z.string().regex(/^[a-z0-9-]+$/, "Pick your department."),
});

export const loginSchema = z.object({
  email: z.email({ message: "Enter a valid email." }).trim().toLowerCase(),
  password: z.string().min(1, "Enter your password."),
});

export const taskSchema = z.object({
  title: z.string().trim().min(1, "Say what you did.").max(300, "Keep it under 300 characters."),
  taskTypeId: uuid.optional().or(z.literal("").transform(() => undefined)),
  projectId: uuid.optional().or(z.literal("").transform(() => undefined)),
  detail: optionalText(200),
  status: z.enum(["done", "in_progress"]),
  workDate: day.optional(),
});

export const leaveSchema = z.object({ date: day, note: optionalText(200) });

export const reviewSchema = z
  .object({
    submissionId: uuid,
    decision: z.enum(["approved", "sent_back"]),
    note: optionalText(500),
  })
  .refine((v) => v.decision !== "sent_back" || !!v.note, { message: "Add a note when sending a day back.", path: ["note"] });

export const flagSchema = z.object({ taskId: uuid, flagged: z.boolean(), note: optionalText(500) });

export const projectSchema = z
  .object({
    name: z.string().trim().min(1, "Give the project a name.").max(160, "Keep the name under 160 characters."),
    client: optionalText(120),
    brief: optionalText(2000),
    startDate: day.optional().or(z.literal("").transform(() => undefined)),
    dueDate: day.optional().or(z.literal("").transform(() => undefined)),
    priority: z.enum(["low", "normal", "high"]),
    members: z.array(uuid).max(50).default([]),
  })
  .refine((v) => !v.startDate || !v.dueDate || v.startDate <= v.dueDate, { message: "The due date can't be before the start date.", path: ["dueDate"] });

export const projectStatusSchema = z.enum(["planning", "in_progress", "review", "revision", "completed", "on_hold"]);

export const todoSchema = z.object({
  projectId: uuid,
  title: z.string().trim().min(1, "Add a to-do.").max(200, "Keep it under 200 characters."),
  assigneeId: uuid.optional().or(z.literal("").transform(() => undefined)),
  dueDate: day.optional().or(z.literal("").transform(() => undefined)),
});

export const linkSchema = z.object({
  projectId: uuid,
  name: z.string().trim().min(1, "Name the link.").max(200),
  url: z.url({ protocol: /^https?$/, message: "Use a full https:// link." }),
});

export const commentSchema = z.object({ projectId: uuid, body: z.string().trim().min(1, "Write a comment.").max(2000) });

export const settingsSchema = z.object({
  office_start: z.string().regex(/^\d{2}:\d{2}$/),
  office_end: z.string().regex(/^\d{2}:\d{2}$/),
  late_after: z.string().regex(/^\d{2}:\d{2}$/),
  half_day_minutes: z.coerce.number().int().min(30).max(720),
  reminder_at: z.string().regex(/^\d{2}:\d{2}$/),
  mentor_digest_at: z.string().regex(/^\d{2}:\d{2}$/),
  weekly_off: z.string().regex(/^(mon|tue|wed|thu|fri|sat|sun)(,(mon|tue|wed|thu|fri|sat|sun))*$/, "Use days like sun or sat,sun."),
});

export const holidaySchema = z.object({ day, name: z.string().trim().min(1).max(120) });

export const departmentSchema = z.object({
  id: uuid.optional(),
  name: z.string().trim().min(1).max(60),
  slug: z.string().trim().regex(/^[a-z0-9-]+$/, "Use lowercase letters, numbers and dashes.").max(40),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/, "Use a hex colour like #C9A23F."),
  detailLabel: optionalText(40),
});

export const reportFilterSchema = z.object({
  from: day,
  to: day,
  department: z.string().optional(),
  person: z.string().optional(),
  project: z.string().optional(),
});

/** First error message from a failed parse. */
export function firstError(error: z.ZodError): string {
  return error.issues[0]?.message ?? "Check the form and try again.";
}
