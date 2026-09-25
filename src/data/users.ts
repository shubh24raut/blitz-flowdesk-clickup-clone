import type { Organization, User } from "@/types";
import { daysFromNow } from "./time";

export const CURRENT_USER_ID = "u_sachin";

export function seedOrganization(): Organization {
  return {
    id: "org_dreamkasper",
    name: "Dream Kasper LLP",
    website: "https://dreamkasper.com",
    plan: "Pro",
  };
}

export function seedUsers(): User[] {
  return [
    {
      id: "u_sachin",
      name: "Sachin Darde",
      email: "sachin@dreamkasper.com",
      title: "Founder & Product Lead",
      role: "Owner",
      status: "Active",
      color: "#5B5CF6",
      joinedAt: daysFromNow(-720),
    },
    {
      id: "u_aditya",
      name: "Aditya Patil",
      email: "aditya@dreamkasper.com",
      title: "Senior Full-stack Developer",
      role: "Admin",
      status: "Active",
      color: "#0EA5E9",
      joinedAt: daysFromNow(-540),
    },
    {
      id: "u_mayuri",
      name: "Mayuri Shah",
      email: "mayuri@dreamkasper.com",
      title: "Frontend Developer",
      role: "Member",
      status: "Active",
      color: "#EC4899",
      joinedAt: daysFromNow(-400),
    },
    {
      id: "u_venky",
      name: "Venky Rao",
      email: "venky@dreamkasper.com",
      title: "Backend Developer",
      role: "Member",
      status: "Active",
      color: "#F59E0B",
      joinedAt: daysFromNow(-380),
    },
    {
      id: "u_priya",
      name: "Priya Nair",
      email: "priya@dreamkasper.com",
      title: "UI/UX Designer",
      role: "Member",
      status: "Active",
      color: "#8B5CF6",
      joinedAt: daysFromNow(-300),
    },
    {
      id: "u_rahul",
      name: "Rahul Mehta",
      email: "rahul@dreamkasper.com",
      title: "QA Engineer",
      role: "Member",
      status: "Active",
      color: "#22C55E",
      joinedAt: daysFromNow(-210),
    },
    {
      id: "u_neha",
      name: "Neha Kapoor",
      email: "neha@dreamkasper.com",
      title: "Project Manager",
      role: "Admin",
      status: "Active",
      color: "#06B6D4",
      joinedAt: daysFromNow(-180),
    },
    {
      id: "u_arjun",
      name: "Arjun Singh",
      email: "arjun@dreamkasper.com",
      title: "DevOps Engineer",
      role: "Member",
      status: "Invited",
      color: "#F97316",
      joinedAt: daysFromNow(-3),
    },
  ];
}
