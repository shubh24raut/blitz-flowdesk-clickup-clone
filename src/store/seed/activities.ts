import type { Activity, AppNotification } from "@/types";
import { hoursAgo, minutesAgo } from "./time";

type ActivitySeed = Omit<Activity, "id" | "clientId"> & { clientId?: string | null };

export function seedActivities(): Activity[] {
  const items: ActivitySeed[] = [
    { actorId: "u_mayuri", action: "moved", target: "API integration", from: "Design", to: "Development", projectId: "p_web", taskId: "t_api", createdAt: minutesAgo(10) },
    { actorId: "u_aditya", action: "commented on", target: "Design homepage (v2)", projectId: "p_web", taskId: "t_web_6", createdAt: hoursAgo(2) },
    { actorId: "u_sachin", action: "added a new task", target: "Performance testing", projectId: "p_web", taskId: "t_web_15", createdAt: hoursAgo(4) },
    { actorId: "u_venky", action: "uploaded an attachment to", target: "API integration", projectId: "p_web", taskId: "t_api", createdAt: hoursAgo(5) },
    { actorId: "u_aditya", action: "changed the priority of", target: "API integration", from: "Medium", to: "High", projectId: "p_web", taskId: "t_api", createdAt: hoursAgo(7) },
    { actorId: "u_mayuri", action: "completed checklist item", target: "Integrate contact form", projectId: "p_web", taskId: "t_api", createdAt: hoursAgo(9) },
    { actorId: "u_neha", action: "moved", target: "Define MVP scope", from: "Ideas", to: "Planning", projectId: "p_mobile", taskId: "t_mobile_5", createdAt: hoursAgo(11) },
    { actorId: "u_priya", action: "moved", target: "Color palette", from: "Review", to: "Done", projectId: "p_brand", taskId: "t_brand_7", createdAt: hoursAgo(20) },
    { actorId: "u_sachin", action: "created the project", target: "Mobile App", projectId: "p_mobile", taskId: null, clientId: "c_globex", createdAt: hoursAgo(26) },
    { actorId: "u_aditya", action: "assigned", target: "Stripe billing integration", to: "Aditya Patil", projectId: "p_portal", taskId: "t_portal_4", createdAt: hoursAgo(30) },
    { actorId: "u_sachin", action: "updated client", target: "Acme Studio", projectId: null, taskId: null, clientId: "c_acme", createdAt: hoursAgo(50) },
    { actorId: "u_neha", action: "put the project on hold", target: "Customer Portal", projectId: "p_portal", taskId: null, clientId: "c_techify", createdAt: hoursAgo(72) },
  ];
  return items.map((item, index) => ({ clientId: null, ...item, id: `ac_seed_${index + 1}` }));
}

export function seedNotifications(): AppNotification[] {
  return [
    { id: "n_1", actorId: "u_priya", message: "mentioned you in “Design homepage (v2)”", href: "/projects/p_web/tasks?task=t_web_6", read: false, createdAt: hoursAgo(20) },
    { id: "n_2", actorId: "u_neha", message: "assigned you to “Kickoff meeting”", href: "/projects/p_mobile/tasks?task=t_mobile_3", read: false, createdAt: hoursAgo(3) },
    { id: "n_3", actorId: "u_mayuri", message: "reacted ❤️ to your comment on “API integration”", href: "/projects/p_web/tasks?task=t_api", read: false, createdAt: hoursAgo(1) },
    { id: "n_4", actorId: "u_aditya", message: "replied to your comment on “API integration”", href: "/projects/p_web/tasks?task=t_api", read: true, createdAt: hoursAgo(5) },
    { id: "n_5", actorId: "u_rahul", message: "“Performance testing” is due in 7 days", href: "/projects/p_web/tasks?task=t_web_15", read: true, createdAt: hoursAgo(24) },
  ];
}
