import type {
  Activity,
  AppNotification,
  Client,
  Holiday,
  HolidayCalendar,
  LeaveType,
  Organization,
  OrganizationMember,
  Project,
  Stage,
  Task,
  User,
} from "@/types";
import { inOrganization, membership, NORTHWIND_ID } from "./organizations";
import { daysFromNow, hoursAgo } from "./time";

/**
 * A deliberately tiny second workspace for trying organization switching.
 * Shubham is only a Member here, so role-dependent UI differs from Dream Kasper.
 */

const UK_CALENDAR_ID = "hc_nw_england";

export function seedNorthwindOrganization(): Organization {
  return {
    id: NORTHWIND_ID,
    name: "Northwind Studio",
    slug: "northwind-studio",
    website: "https://northwind.studio",
    plan: "Free",
    workingDays: [1, 2, 3, 4, 5],
    defaultHolidayCalendarId: UK_CALENDAR_ID,
    createdAt: daysFromNow(-90),
    updatedAt: daysFromNow(-12),
  };
}

export function seedNorthwindUsers(): User[] {
  return [
    {
      id: "u_chloe",
      name: "Chloe Harper",
      email: "chloe@northwind.studio",
      title: "Creative Director",
      color: "#0EA5E9",
      createdAt: daysFromNow(-90),
    },
  ];
}

export function seedNorthwindMembers(): OrganizationMember[] {
  return [
    membership(NORTHWIND_ID, "u_chloe", { role: "Owner", status: "Active", joinedAt: daysFromNow(-90) }),
    membership(NORTHWIND_ID, "u_shubham", { role: "Member", status: "Active", joinedAt: daysFromNow(-40) }),
  ];
}

export function seedNorthwindData() {
  const clients = inOrganization<Client>(NORTHWIND_ID, [
    {
      id: "c_nw_bloom",
      name: "Bloom Bakery",
      contactPerson: "Hannah Clarke",
      email: "hannah@bloombakery.co.uk",
      phone: "+44 20 7946 0321",
      website: "https://bloombakery.co.uk",
      industry: "Food & Beverage",
      address: "12 Camden Passage, London",
      status: "Active",
      color: "#F97316",
      notes: "Small independent bakery chain — three shops in north London.",
      contacts: [{ id: "cc_nw_1", name: "Hannah Clarke", role: "Owner", email: "hannah@bloombakery.co.uk", phone: "+44 20 7946 0321" }],
      createdAt: daysFromNow(-60),
    },
  ]);

  const projects = inOrganization<Project>(NORTHWIND_ID, [
    {
      id: "p_nw_bloom",
      name: "Bloom Bakery Rebrand",
      description: "New logo, packaging and a simple ordering website for Bloom Bakery.",
      clientId: "c_nw_bloom",
      status: "Active",
      color: "#F97316",
      startDate: daysFromNow(-21),
      dueDate: daysFromNow(28),
      memberIds: ["u_chloe", "u_shubham"],
      starred: false,
      key: "BB",
      createdAt: daysFromNow(-21),
    },
  ]);

  const stages: Stage[] = [
    { id: "s_nw_todo", projectId: "p_nw_bloom", name: "To Do", color: "#94A3B8", order: 0, isCompleted: false },
    { id: "s_nw_doing", projectId: "p_nw_bloom", name: "In Progress", color: "#5B5CF6", order: 1, isCompleted: false },
    { id: "s_nw_done", projectId: "p_nw_bloom", name: "Done", color: "#22C55E", order: 2, isCompleted: true },
  ];

  const task = (
    id: string,
    number: number,
    stageId: string,
    order: number,
    title: string,
    assigneeIds: string[],
    due: number,
    priority: Task["priority"] = "Medium",
  ): Task => ({
    id,
    number,
    projectId: "p_nw_bloom",
    stageId,
    order,
    title,
    description: "",
    priority,
    assigneeIds,
    dueDate: daysFromNow(due),
    tags: [],
    checklist: [],
    createdById: "u_chloe",
    createdAt: daysFromNow(-20),
    updatedAt: hoursAgo(order * 5 + 2),
    completedAt: stageId === "s_nw_done" ? daysFromNow(-4) : null,
  });

  const tasks: Task[] = [
    task("t_nw_1", 100, "s_nw_todo", 0, "Packaging mock-ups", ["u_chloe"], 12),
    task("t_nw_2", 101, "s_nw_doing", 0, "Logo concepts round 2", ["u_shubham"], 4, "High"),
    task("t_nw_3", 102, "s_nw_doing", 1, "Ordering site wireframes", ["u_shubham", "u_chloe"], 9),
    task("t_nw_4", 103, "s_nw_done", 0, "Brand discovery workshop", ["u_chloe"], -6),
  ];

  const activities = inOrganization<Activity>(NORTHWIND_ID, [
    { id: "ac_nw_1", actorId: "u_chloe", action: "moved", target: "Logo concepts round 2", from: "To Do", to: "In Progress", projectId: "p_nw_bloom", taskId: "t_nw_2", clientId: null, createdAt: hoursAgo(6) },
    { id: "ac_nw_2", actorId: "u_chloe", action: "created the project", target: "Bloom Bakery Rebrand", projectId: "p_nw_bloom", taskId: null, clientId: "c_nw_bloom", createdAt: daysFromNow(-21) },
  ]);

  const notifications = inOrganization<AppNotification>(NORTHWIND_ID, [
    { id: "n_nw_1", actorId: "u_chloe", message: "assigned you to “Logo concepts round 2”", href: "/projects/p_nw_bloom/tasks?task=t_nw_2", read: false, createdAt: hoursAgo(6) },
  ]);

  const holidayCalendars = inOrganization<HolidayCalendar>(NORTHWIND_ID, [
    { id: UK_CALENDAR_ID, name: "United Kingdom — England", countryCode: "GB", regionCode: "ENG" },
  ]);

  const year = new Date().getFullYear();
  const holidays = inOrganization<Holiday>(
    NORTHWIND_ID,
    [year, year + 1].flatMap((y) => [
      { id: `hol_nw_${y}_xmas`, calendarId: UK_CALENDAR_ID, name: "Christmas Day", date: `${y}-12-25`, kind: "public" as const },
      { id: `hol_nw_${y}_boxing`, calendarId: UK_CALENDAR_ID, name: "Boxing Day", date: `${y}-12-26`, kind: "public" as const },
      { id: `hol_nw_${y}_newyear`, calendarId: UK_CALENDAR_ID, name: "New Year's Day", date: `${y}-01-01`, kind: "public" as const },
    ]),
  );

  const leaveTypes = inOrganization<LeaveType>(NORTHWIND_ID, [
    { id: "lt_nw_annual", name: "Annual leave", color: "#0EA5E9", allowance: 20, paid: true, requiresApproval: true },
    { id: "lt_nw_sick", name: "Sick leave", color: "#F59E0B", allowance: null, paid: true, requiresApproval: false },
  ]);

  return { clients, projects, stages, tasks, activities, notifications, holidayCalendars, holidays, leaveTypes };
}
