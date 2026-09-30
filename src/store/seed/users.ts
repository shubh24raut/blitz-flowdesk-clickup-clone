import type { Organization, OrganizationMember, User } from "@/types";
import { DREAM_KASPER_ID, membership } from "./organizations";
import { daysFromNow } from "./time";
import { SEED_HOLIDAY_CALENDAR_ID, SEED_WORKING_DAYS } from "./time-off";

export const CURRENT_USER_ID = "u_shubham";

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
      id: "u_shubham",
      name: "Shubham Raut",
      email: "shubham@dreamkasper.test",
      title: "Founder & Product Lead",
      color: "#5B5CF6",
      createdAt: daysFromNow(-720),
    },
    {
      id: "u_rohan",
      name: "Rohan Kulkarni",
      email: "rohan@dreamkasper.test",
      title: "Senior Full-stack Developer",
      color: "#0EA5E9",
      createdAt: daysFromNow(-540),
    },
    {
      id: "u_ananya",
      name: "Ananya Joshi",
      email: "ananya@dreamkasper.test",
      title: "Frontend Developer",
      color: "#EC4899",
      createdAt: daysFromNow(-400),
    },
    {
      id: "u_karan",
      name: "Karan Iyer",
      email: "karan@dreamkasper.test",
      title: "Backend Developer",
      color: "#F59E0B",
      createdAt: daysFromNow(-380),
    },
    {
      id: "u_isha",
      name: "Isha Menon",
      email: "isha@dreamkasper.test",
      title: "UI/UX Designer",
      color: "#8B5CF6",
      createdAt: daysFromNow(-300),
    },
    {
      id: "u_vikram",
      name: "Vikram Desai",
      email: "vikram@dreamkasper.test",
      title: "QA Engineer",
      color: "#22C55E",
      createdAt: daysFromNow(-210),
    },
    {
      id: "u_sneha",
      name: "Sneha Pillai",
      email: "sneha@dreamkasper.test",
      title: "Project Manager",
      color: "#06B6D4",
      createdAt: daysFromNow(-180),
    },
    {
      id: "u_dev",
      name: "Dev Malhotra",
      email: "dev@dreamkasper.test",
      title: "DevOps Engineer",
      color: "#F97316",
      createdAt: daysFromNow(-3),
    },
  ];
}

export function seedMembers(): OrganizationMember[] {
  return [
    membership(DREAM_KASPER_ID, "u_shubham", { role: "Owner", status: "Active", joinedAt: daysFromNow(-720) }),
    membership(DREAM_KASPER_ID, "u_rohan", { role: "Admin", status: "Active", joinedAt: daysFromNow(-540) }),
    membership(DREAM_KASPER_ID, "u_ananya", { role: "Member", status: "Active", joinedAt: daysFromNow(-400) }),
    membership(DREAM_KASPER_ID, "u_karan", { role: "Member", status: "Active", joinedAt: daysFromNow(-380) }),
    membership(DREAM_KASPER_ID, "u_isha", { role: "Member", status: "Active", joinedAt: daysFromNow(-300) }),
    membership(DREAM_KASPER_ID, "u_vikram", { role: "Member", status: "Active", joinedAt: daysFromNow(-210) }),
    membership(DREAM_KASPER_ID, "u_sneha", { role: "Admin", status: "Active", joinedAt: daysFromNow(-180) }),
    membership(DREAM_KASPER_ID, "u_dev", { role: "Member", status: "Invited", joinedAt: daysFromNow(-3) }),
  ];
}
