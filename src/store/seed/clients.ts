import type { Client } from "@/types";
import type { Unscoped } from "./organizations";
import { daysFromNow } from "./time";

export function seedClients(): Unscoped<Client>[] {
  return [
    {
      id: "c_acme",
      name: "Acme Studio",
      contactPerson: "John Doe",
      email: "john@acme.com",
      phone: "+1 415 555 0132",
      website: "https://acme.studio",
      industry: "Creative Agency",
      address: "88 Market Street, San Francisco, CA",
      status: "Active",
      color: "#EC4899",
      notes:
        "Long-term retainer client. Prefers weekly status calls on Mondays and async updates in the shared Slack channel.",
      contacts: [
        { id: "cc_1", name: "John Doe", role: "Marketing Director", email: "john@acme.com", phone: "+1 415 555 0132" },
        { id: "cc_2", name: "Lisa Ray", role: "Brand Manager", email: "lisa@acme.com", phone: "+1 415 555 0190" },
      ],
      createdAt: daysFromNow(-260),
    },
    {
      id: "c_globex",
      name: "Globex Corporation",
      contactPerson: "Sarah Wilson",
      email: "sarah@globex.com",
      phone: "+1 212 555 0148",
      website: "https://globex.com",
      industry: "Logistics",
      address: "500 5th Avenue, New York, NY",
      status: "Active",
      color: "#06B6D4",
      notes: "Enterprise account. All deliverables need sign-off from the product committee.",
      contacts: [
        { id: "cc_3", name: "Sarah Wilson", role: "VP Product", email: "sarah@globex.com", phone: "+1 212 555 0148" },
      ],
      createdAt: daysFromNow(-200),
    },
    {
      id: "c_techify",
      name: "Techify",
      contactPerson: "Michael Chen",
      email: "michael@techify.com",
      phone: "+1 650 555 0110",
      website: "https://techify.io",
      industry: "SaaS",
      address: "1 Infinite Loop, Cupertino, CA",
      status: "Active",
      color: "#3B82F6",
      notes: "Fast-moving startup. Prefers short iterations and demo videos over long documents.",
      contacts: [
        { id: "cc_4", name: "Michael Chen", role: "CTO", email: "michael@techify.com", phone: "+1 650 555 0110" },
        { id: "cc_5", name: "Anna Lee", role: "Product Owner", email: "anna@techify.com", phone: "+1 650 555 0177" },
      ],
      createdAt: daysFromNow(-150),
    },
    {
      id: "c_nextgen",
      name: "NextGen Media",
      contactPerson: "Emily Parker",
      email: "emily@nextgen.com",
      phone: "+44 20 7946 0958",
      website: "https://nextgen.media",
      industry: "Media & Publishing",
      address: "12 Shoreditch High St, London",
      status: "Active",
      color: "#A855F7",
      notes: "Rebrand in progress. Brand guidelines must be finalised before the Q4 campaign.",
      contacts: [
        { id: "cc_6", name: "Emily Parker", role: "Creative Lead", email: "emily@nextgen.com", phone: "+44 20 7946 0958" },
      ],
      createdAt: daysFromNow(-120),
    },
    {
      id: "c_mindful",
      name: "Mindful Health",
      contactPerson: "David Kim",
      email: "david@mindful.com",
      phone: "+1 312 555 0199",
      website: "https://mindful.health",
      industry: "Healthcare",
      address: "233 S Wacker Dr, Chicago, IL",
      status: "Inactive",
      color: "#EF4444",
      notes: "Campaign delivered. Follow up in Q1 about the patient portal project.",
      contacts: [
        { id: "cc_7", name: "David Kim", role: "Head of Marketing", email: "david@mindful.com", phone: "+1 312 555 0199" },
      ],
      createdAt: daysFromNow(-320),
    },
  ];
}
