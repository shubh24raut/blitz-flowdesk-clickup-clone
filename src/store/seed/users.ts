import type { Organization, OrganizationMember, User } from "@/types";
import { DREAM_KASPER_ID, membership } from "./organizations";
import { daysFromNow } from "./time";
import { SEED_HOLIDAY_CALENDAR_ID, SEED_WORKING_DAYS } from "./time-off";

export const CURRENT_USER_ID = "u_sachin";

export function seedOrganization(): Organization {
  return {
    id: DREAM_KASPER_ID,
    name: "Dream Kasper LLP",
    slug: "dream-kasper",
    website: "https://dreamkasper.com",
    plan: "Pro",
    workingDays: SEED_WORKING_DAYS,
    defaultHolidayCalendarId: SEED_HOLIDAY_CALENDAR_ID,
    createdAt: daysFromNow(-720),
    updatedAt: daysFromNow(-30),
  };
}

export function seedUsers(): User[] {
  return [
    {
      id: "u_sachin",
      name: "Sachin Darde",
      email: "sachin@dreamkasper.com",
      title: "Founder & Product Lead",
      color: "#5B5CF6",
      createdAt: daysFromNow(-720),
    },
    {
      id: "u_aditya",
      name: "Aditya Patil",
      email: "aditya@dreamkasper.com",
      title: "Senior Full-stack Developer",
      color: "#0EA5E9",
      createdAt: daysFromNow(-540),
    },
    {
      id: "u_mayuri",
      name: "Mayuri Shah",
      email: "mayuri@dreamkasper.com",
      title: "Frontend Developer",
      color: "#EC4899",
      createdAt: daysFromNow(-400),
    },
    {
      id: "u_venky",
      name: "Venky Rao",
      email: "venky@dreamkasper.com",
      title: "Backend Developer",
      color: "#F59E0B",
      createdAt: daysFromNow(-380),
    },
    {
      id: "u_priya",
      name: "Priya Nair",
      email: "priya@dreamkasper.com",
      title: "UI/UX Designer",
      color: "#8B5CF6",
      createdAt: daysFromNow(-300),
    },
    {
      id: "u_rahul",
      name: "Rahul Mehta",
      email: "rahul@dreamkasper.com",
      title: "QA Engineer",
      color: "#22C55E",
      createdAt: daysFromNow(-210),
    },
    {
      id: "u_neha",
      name: "Neha Kapoor",
      email: "neha@dreamkasper.com",
      title: "Project Manager",
      color: "#06B6D4",
      createdAt: daysFromNow(-180),
    },
    {
      id: "u_arjun",
      name: "Arjun Singh",
      email: "arjun@dreamkasper.com",
      title: "DevOps Engineer",
      color: "#F97316",
      createdAt: daysFromNow(-3),
    },
  ];
}

export function seedMembers(): OrganizationMember[] {
  return [
    membership(DREAM_KASPER_ID, "u_sachin", { role: "Owner", status: "Active", joinedAt: daysFromNow(-720) }),
    membership(DREAM_KASPER_ID, "u_aditya", { role: "Admin", status: "Active", joinedAt: daysFromNow(-540) }),
    membership(DREAM_KASPER_ID, "u_mayuri", { role: "Member", status: "Active", joinedAt: daysFromNow(-400) }),
    membership(DREAM_KASPER_ID, "u_venky", { role: "Member", status: "Active", joinedAt: daysFromNow(-380) }),
    membership(DREAM_KASPER_ID, "u_priya", { role: "Member", status: "Active", joinedAt: daysFromNow(-300) }),
    membership(DREAM_KASPER_ID, "u_rahul", { role: "Member", status: "Active", joinedAt: daysFromNow(-210) }),
    membership(DREAM_KASPER_ID, "u_neha", { role: "Admin", status: "Active", joinedAt: daysFromNow(-180) }),
    membership(DREAM_KASPER_ID, "u_arjun", { role: "Member", status: "Invited", joinedAt: daysFromNow(-3) }),
  ];
}
