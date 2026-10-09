// RPCs raise plain-English messages. Pass those through; hide everything else.
const KNOWN = [
  "This registration is not waiting for approval",
  "Only a mentor",
  "Unknown department",
  "You can't change your own department",
  "Only active members can be moved",
  "Your account is not active",
  "This day is closed",
  "Add at least one task before sending your day",
  "Submission not found",
  "You can't review your own day",
  "Add a note when sending a day back",
  "You've already checked in",
  "Check in first, or you've already checked out",
  "Admins only",
  "You can't remove your own admin role",
  "You can't change your own account status",
  "Approve the registration with a department first",
  "Leave can only be marked",
  "Leave can be marked up to",
  "You're already on leave",
  "Past leave can't be changed",
  "No leave found",
  "Keep the leave note",
  "That type of work belongs to another department",
  "Only an admin can change a project",
  "This person isn't active",
  "Person not found",
];

export function friendlyError(error: { message?: string; code?: string } | null | undefined, fallback = "Something went wrong. Try again."): string {
  const msg = error?.message ?? "";
  if (KNOWN.some((k) => msg.startsWith(k))) return msg;
  if (error?.code === "42501" || msg.includes("row-level security")) return "You don't have permission to do that.";
  if (error?.code === "23505") return "That already exists.";
  if (error?.code === "23514") return "Some of that input isn't allowed. Check the fields and try again.";
  return fallback;
}

export type ActionResult<T = undefined> = { ok: true; data?: T; message?: string } | { ok: false; error: string };
