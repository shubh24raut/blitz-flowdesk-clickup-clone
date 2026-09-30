import type { Project, Stage } from "@/types";
import type { Unscoped } from "./organizations";
import { daysFromNow } from "./time";

export function seedProjects(): Unscoped<Project>[] {
  return [
    {
      id: "p_web",
      name: "Website Redesign",
      description: "Redesign our marketing website with a modern look and improved conversion.",
      clientId: "c_acme",
      status: "Active",
      color: "#8B5CF6",
      startDate: daysFromNow(-30),
      dueDate: daysFromNow(35),
      memberIds: ["u_shubham", "u_rohan", "u_ananya", "u_karan", "u_isha", "u_vikram"],
      starred: true,
      key: "FD",
      createdAt: daysFromNow(-30),
    },
    {
      id: "p_mobile",
      name: "Mobile App",
      description: "Native iOS and Android app for Globex drivers with live route tracking.",
      clientId: "c_globex",
      status: "Active",
      color: "#22C55E",
      startDate: daysFromNow(-10),
      dueDate: daysFromNow(80),
      memberIds: ["u_shubham", "u_rohan", "u_sneha", "u_vikram", "u_dev"],
      starred: false,
      key: "MA",
      createdAt: daysFromNow(-10),
    },
    {
      id: "p_brand",
      name: "Brand Guidelines",
      description: "A complete visual identity system and brand book for NextGen Media.",
      clientId: "c_nextgen",
      status: "Active",
      color: "#EF4444",
      startDate: daysFromNow(-21),
      dueDate: daysFromNow(14),
      memberIds: ["u_shubham", "u_isha", "u_ananya"],
      starred: true,
      key: "BG",
      createdAt: daysFromNow(-21),
    },
    {
      id: "p_portal",
      name: "Customer Portal",
      description: "Self-serve account portal with billing, usage analytics and team management.",
      clientId: "c_techify",
      status: "On Hold",
      color: "#3B82F6",
      startDate: daysFromNow(-45),
      dueDate: daysFromNow(60),
      memberIds: ["u_rohan", "u_karan", "u_sneha"],
      starred: false,
      key: "CP",
      createdAt: daysFromNow(-45),
    },
    {
      id: "p_wellness",
      name: "Wellness Campaign",
      description: "Awareness campaign landing pages and email sequences for Mindful Health.",
      clientId: "c_mindful",
      status: "Completed",
      color: "#F59E0B",
      startDate: daysFromNow(-90),
      dueDate: daysFromNow(-20),
      memberIds: ["u_shubham", "u_ananya", "u_isha"],
      starred: false,
      key: "WC",
      createdAt: daysFromNow(-90),
    },
  ];
}

type StageSpec = [id: string, name: string, color: string, isCompleted?: boolean];

function stagesFor(projectId: string, specs: StageSpec[]): Stage[] {
  return specs.map(([id, name, color, isCompleted = false], order) => ({
    id,
    projectId,
    name,
    color,
    order,
    isCompleted,
  }));
}

export function seedStages(): Stage[] {
  return [
    ...stagesFor("p_web", [
      ["s_web_backlog", "Backlog", "#94A3B8"],
      ["s_web_design", "Design", "#8B5CF6"],
      ["s_web_dev", "Development", "#3B82F6"],
      ["s_web_qa", "QA", "#F59E0B"],
      ["s_web_review", "Client Review", "#EC4899"],
      ["s_web_done", "Done", "#22C55E", true],
    ]),
    ...stagesFor("p_mobile", [
      ["s_mob_ideas", "Ideas", "#94A3B8"],
      ["s_mob_planning", "Planning", "#06B6D4"],
      ["s_mob_building", "Building", "#3B82F6"],
      ["s_mob_testing", "Testing", "#F59E0B"],
      ["s_mob_approved", "Approved", "#8B5CF6", true],
      ["s_mob_delivered", "Delivered", "#22C55E", true],
    ]),
    ...stagesFor("p_brand", [
      ["s_brand_todo", "To Do", "#94A3B8"],
      ["s_brand_progress", "In Progress", "#5B5CF6"],
      ["s_brand_review", "Review", "#EC4899"],
      ["s_brand_done", "Done", "#22C55E", true],
    ]),
    ...stagesFor("p_portal", [
      ["s_portal_backlog", "Backlog", "#94A3B8"],
      ["s_portal_sprint", "Sprint", "#06B6D4"],
      ["s_portal_progress", "In Progress", "#3B82F6"],
      ["s_portal_review", "Code Review", "#F97316"],
      ["s_portal_released", "Released", "#22C55E", true],
    ]),
    ...stagesFor("p_wellness", [
      ["s_well_draft", "Draft", "#94A3B8"],
      ["s_well_review", "Review", "#F59E0B"],
      ["s_well_published", "Published", "#22C55E", true],
    ]),
  ];
}
