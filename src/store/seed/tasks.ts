import type { Priority, Task } from "@/types";
import { daysFromNow, hoursAgo } from "./time";

interface TaskSpec {
  id?: string;
  number?: number;
  stage: string;
  title: string;
  priority: Priority;
  due: number | null;
  assignees: string[];
  tags?: string[];
  description?: string;
  checklist?: Array<[text: string, done: boolean, assigneeId: string | null]>;
  createdDaysAgo?: number;
}

function build(projectId: string, completedStages: string[], specs: TaskSpec[]): Task[] {
  const orderByStage = new Map<string, number>();
  return specs.map((spec, index) => {
    const order = orderByStage.get(spec.stage) ?? 0;
    orderByStage.set(spec.stage, order + 1);
    const created = daysFromNow(-(spec.createdDaysAgo ?? (index * 5) % 16), 10);
    const isDone = completedStages.includes(spec.stage);
    return {
      id: spec.id ?? `t_${projectId.slice(2)}_${index + 1}`,
      number: spec.number ?? 100 + index,
      projectId,
      stageId: spec.stage,
      order,
      title: spec.title,
      description: spec.description ?? "",
      priority: spec.priority,
      assigneeIds: spec.assignees,
      dueDate: spec.due === null ? null : daysFromNow(spec.due),
      tags: spec.tags ?? [],
      checklist: (spec.checklist ?? []).map(([text, done, assigneeId], i) => ({
        id: `cl_${projectId.slice(2)}_${index}_${i}`,
        text,
        done,
        assigneeId,
      })),
      createdById: "u_sachin",
      createdAt: created,
      updatedAt: hoursAgo(index * 3 + 1),
      completedAt: isDone ? daysFromNow(-(index % 6) - 1, 16) : null,
    };
  });
}

export function seedTasks(): Task[] {
  return [
    ...build("p_web", ["s_web_done"], [
      { stage: "s_web_backlog", title: "Research competitor websites", tags: ["Research"], priority: "Low", due: 10, assignees: ["u_venky"], description: "Review 5–8 competitor sites and summarise navigation patterns, pricing presentation and conversion flows." },
      { stage: "s_web_backlog", title: "Create sitemap", tags: ["Planning"], priority: "Medium", due: 13, assignees: ["u_aditya"] },
      { stage: "s_web_backlog", title: "Define project goals", tags: ["Planning"], priority: "Low", due: 15, assignees: ["u_mayuri"] },
      { stage: "s_web_backlog", title: "Set up analytics tracking", tags: ["Technical"], priority: "Medium", due: 17, assignees: ["u_priya"], checklist: [["Create GA4 property", false, "u_venky"], ["Define conversion events", false, null]] },
      { stage: "s_web_backlog", title: "Content audit", tags: ["Research"], priority: "Low", due: 19, assignees: ["u_mayuri"] },
      { stage: "s_web_design", title: "Design homepage (v2)", tags: ["Design"], priority: "High", due: 3, assignees: ["u_priya", "u_sachin"], description: "Second iteration of the homepage based on stakeholder feedback. Focus on the **hero section** and social proof.", checklist: [["Hero variations", true, "u_priya"], ["Testimonials block", true, "u_priya"], ["Footer redesign", false, "u_priya"]] },
      { stage: "s_web_design", title: "Create design system", tags: ["Design"], priority: "Medium", due: 7, assignees: ["u_mayuri"] },
      { stage: "s_web_design", title: "Design mobile views", tags: ["Design"], priority: "Medium", due: 9, assignees: ["u_mayuri"] },
      { stage: "s_web_design", title: "Design pricing page", tags: ["Design"], priority: "Low", due: 11, assignees: ["u_aditya"] },
      { stage: "s_web_dev", title: "Implement homepage", tags: ["Development"], priority: "High", due: 13, assignees: ["u_sachin", "u_aditya"] },
      { stage: "s_web_dev", title: "Build components", tags: ["Development"], priority: "Medium", due: 15, assignees: ["u_aditya"] },
      {
        id: "t_api",
        number: 123,
        stage: "s_web_dev",
        title: "API integration",
        tags: ["Development"],
        priority: "High",
        due: 20,
        assignees: ["u_aditya"],
        description:
          "Integrate backend APIs for contact form, newsletter signup and blog content.\n\nImplement and integrate the required APIs for the new website. This includes:\n- Contact form submission (with email notification)\n- Newsletter signup (integrate with Mailchimp)\n- Blog content (fetch from headless CMS)",
        checklist: [
          ["Set up API endpoints", true, "u_mayuri"],
          ["Integrate contact form", true, "u_mayuri"],
          ["Integrate newsletter signup", true, "u_aditya"],
          ["Fetch blog posts from CMS", false, "u_venky"],
          ["Error handling and validation", false, "u_aditya"],
        ],
      },
      { stage: "s_web_dev", title: "Responsive cleanup", tags: ["Development"], priority: "Low", due: 23, assignees: ["u_mayuri"] },
      { stage: "s_web_qa", title: "Cross browser testing", tags: ["QA"], priority: "Medium", due: 25, assignees: ["u_rahul"] },
      { stage: "s_web_qa", title: "Performance testing", tags: ["QA"], priority: "Medium", due: 7, assignees: ["u_rahul"] },
      { stage: "s_web_qa", title: "Fix reported bugs", tags: ["QA"], priority: "High", due: 17, assignees: ["u_sachin", "u_mayuri"] },
      { stage: "s_web_review", title: "Share staging link", tags: ["Review"], priority: "Low", due: 30, assignees: ["u_venky"] },
      { stage: "s_web_review", title: "Incorporate feedback", tags: ["Review"], priority: "Medium", due: 33, assignees: ["u_mayuri"] },
      { stage: "s_web_done", title: "Project brief", priority: "Low", due: -13, assignees: ["u_sachin"] },
      { stage: "s_web_done", title: "Initial wireframes", tags: ["Design"], priority: "Medium", due: -10, assignees: ["u_mayuri"] },
      { stage: "s_web_done", title: "Kickoff meeting", priority: "Low", due: -15, assignees: ["u_sachin"] },
    ]),
    ...build("p_mobile", ["s_mob_approved", "s_mob_delivered"], [
      { stage: "s_mob_ideas", title: "Offline mode exploration", tags: ["Research"], priority: "Low", due: 30, assignees: ["u_aditya"] },
      { stage: "s_mob_ideas", title: "Driver gamification ideas", tags: ["Research"], priority: "Low", due: null, assignees: [] },
      { stage: "s_mob_planning", title: "Kickoff meeting", tags: ["Planning"], priority: "Medium", due: 8, assignees: ["u_neha", "u_sachin"] },
      { stage: "s_mob_planning", title: "Prepare client presentation", tags: ["Planning"], priority: "Low", due: 20, assignees: ["u_sachin"] },
      { stage: "s_mob_planning", title: "Define MVP scope", tags: ["Planning"], priority: "High", due: 5, assignees: ["u_neha"] },
      { stage: "s_mob_building", title: "Set up React Native project", tags: ["Technical"], priority: "High", due: 12, assignees: ["u_aditya", "u_arjun"] },
      { stage: "s_mob_building", title: "Live route tracking prototype", tags: ["Development"], priority: "Urgent", due: 4, assignees: ["u_aditya"] },
      { stage: "s_mob_testing", title: "Device test matrix", tags: ["QA"], priority: "Medium", due: 22, assignees: ["u_rahul"] },
      { stage: "s_mob_approved", title: "Tech stack decision", tags: ["Technical"], priority: "Medium", due: -2, assignees: ["u_aditya"] },
      { stage: "s_mob_delivered", title: "Discovery workshop", tags: ["Planning"], priority: "Low", due: -6, assignees: ["u_neha"] },
    ]),
    ...build("p_brand", ["s_brand_done"], [
      { stage: "s_brand_todo", title: "Iconography set", tags: ["Design"], priority: "Low", due: 12, assignees: ["u_priya"] },
      { stage: "s_brand_todo", title: "Motion guidelines", tags: ["Design"], priority: "Low", due: 14, assignees: [] },
      { stage: "s_brand_progress", title: "Review design system", tags: ["Design"], priority: "Medium", due: 15, assignees: ["u_sachin", "u_priya"] },
      { stage: "s_brand_progress", title: "Typography scale", tags: ["Design"], priority: "Medium", due: 6, assignees: ["u_priya"] },
      { stage: "s_brand_review", title: "Client feedback review", tags: ["Review"], priority: "High", due: 5, assignees: ["u_sachin", "u_mayuri"] },
      { stage: "s_brand_done", title: "Logo exploration", tags: ["Design"], priority: "High", due: -7, assignees: ["u_priya"] },
      { stage: "s_brand_done", title: "Color palette", tags: ["Design"], priority: "Medium", due: -4, assignees: ["u_priya"] },
      { stage: "s_brand_done", title: "Mood boards", tags: ["Research"], priority: "Low", due: -12, assignees: ["u_mayuri"] },
    ]),
    ...build("p_portal", ["s_portal_released"], [
      { stage: "s_portal_backlog", title: "Usage analytics dashboard", tags: ["Development"], priority: "Medium", due: 40, assignees: ["u_venky"] },
      { stage: "s_portal_backlog", title: "SSO support", tags: ["Technical"], priority: "Low", due: 50, assignees: [] },
      { stage: "s_portal_sprint", title: "Invoice history page", tags: ["Development"], priority: "Medium", due: 9, assignees: ["u_venky"] },
      { stage: "s_portal_progress", title: "Stripe billing integration", tags: ["Development"], priority: "High", due: -1, assignees: ["u_aditya"] },
      { stage: "s_portal_review", title: "Team invites flow", tags: ["Development"], priority: "Medium", due: 2, assignees: ["u_aditya", "u_neha"] },
      { stage: "s_portal_released", title: "Account settings", tags: ["Development"], priority: "Low", due: -9, assignees: ["u_venky"] },
    ]),
    ...build("p_wellness", ["s_well_published"], [
      { stage: "s_well_published", title: "Landing page copy", tags: ["Content"], priority: "Medium", due: -40, assignees: ["u_mayuri"] },
      { stage: "s_well_published", title: "Email sequence", tags: ["Marketing"], priority: "Medium", due: -30, assignees: ["u_sachin"] },
      { stage: "s_well_published", title: "Campaign visuals", tags: ["Design"], priority: "High", due: -25, assignees: ["u_priya"] },
    ]),
  ];
}
