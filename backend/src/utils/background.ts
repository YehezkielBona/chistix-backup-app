import { waitUntil } from "@vercel/functions";

export function runInBackground(task: Promise<unknown>) {
  const safeTask = task.catch((err) => console.error("[background-task]", err));
  if (process.env.VERCEL === "1") waitUntil(safeTask);
}