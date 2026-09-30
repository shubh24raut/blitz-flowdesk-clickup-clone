import type { Attachment, Comment } from "@/types";
import { daysFromNow, hoursAgo } from "./time";

export function seedComments(): Comment[] {
  return [
    {
      id: "cm_1",
      projectId: "p_web",
      taskId: "t_api",
      parentId: null,
      authorId: "u_ananya",
      body: "The newsletter API is working great! 🎉\nLet's handle the error message for invalid email separately.",
      reactions: [{ emoji: "❤️", userIds: ["u_shubham"] }],
      createdAt: hoursAgo(2),
      editedAt: null,
    },
    {
      id: "cm_2",
      projectId: "p_web",
      taskId: "t_api",
      parentId: null,
      authorId: "u_rohan",
      body: "Updated the API integration. Added validation and error handling. Please review the attached logs.",
      reactions: [],
      createdAt: hoursAgo(4),
      editedAt: null,
    },
    {
      id: "cm_3",
      projectId: "p_web",
      taskId: "t_api",
      parentId: null,
      authorId: "u_shubham",
      body: "@Rohan Kulkarni can you also add rate limiting to the newsletter endpoint?",
      reactions: [{ emoji: "👍", userIds: ["u_ananya", "u_karan"] }],
      createdAt: hoursAgo(6),
      editedAt: null,
    },
    {
      id: "cm_4",
      projectId: "p_web",
      taskId: "t_api",
      parentId: "cm_3",
      authorId: "u_rohan",
      body: "Sure — I'll add a token bucket limiter (10 req/min per IP) today.",
      reactions: [],
      createdAt: hoursAgo(5),
      editedAt: null,
    },
    {
      id: "cm_5",
      projectId: "p_web",
      taskId: "t_web_6",
      parentId: null,
      authorId: "u_isha",
      body: "Uploaded a walkthrough of the new hero section. @Shubham Raut let me know what you think!",
      reactions: [],
      createdAt: hoursAgo(20),
      editedAt: null,
    },
    {
      id: "cm_6",
      projectId: "p_web",
      taskId: null,
      parentId: null,
      authorId: "u_sneha",
      body: "Reminder: client demo of the staging build is planned for next Friday. Please keep **Client Review** up to date.",
      reactions: [{ emoji: "👍", userIds: ["u_rohan", "u_isha"] }],
      createdAt: hoursAgo(28),
      editedAt: null,
    },
    {
      id: "cm_7",
      projectId: "p_web",
      taskId: null,
      parentId: "cm_6",
      authorId: "u_ananya",
      body: "Got it. Responsive fixes should be done by Wednesday.",
      reactions: [],
      createdAt: hoursAgo(26),
      editedAt: null,
    },
  ];
}

const RESPONSE_JSON = `{
  "status": 200,
  "message": "Subscribed",
  "data": {
    "email": "jane@example.com",
    "list": "website-newsletter",
    "doubleOptIn": true
  }
}`;

export function seedAttachments(): Attachment[] {
  const base = { projectId: "p_web", uploadedById: "u_rohan" } as const;
  return [
    { ...base, id: "at_1", taskId: "t_api", commentId: null, name: "api-docs.pdf", kind: "pdf", mimeType: "application/pdf", size: 2_516_582, url: null, createdAt: daysFromNow(-3) },
    { ...base, id: "at_2", taskId: "t_api", commentId: null, name: "error-log.png", kind: "image", mimeType: "image/png", size: 1_153_433, url: "/mock/error-log.svg", createdAt: hoursAgo(4) },
    { ...base, id: "at_3", taskId: "t_api", commentId: null, name: "flowchart.png", kind: "image", mimeType: "image/png", size: 921_600, url: "/mock/flowchart.svg", uploadedById: "u_ananya", createdAt: daysFromNow(-2) },
    { ...base, id: "at_4", taskId: "t_api", commentId: null, name: "response.json", kind: "code", mimeType: "application/json", size: 12_288, url: null, textContent: RESPONSE_JSON, createdAt: daysFromNow(-1) },
    { ...base, id: "at_5", taskId: "t_api", commentId: "cm_2", name: "error-log.png", kind: "image", mimeType: "image/png", size: 1_153_433, url: "/mock/error-log.svg", createdAt: hoursAgo(4) },
    { ...base, id: "at_6", taskId: "t_web_6", commentId: null, name: "homepage-walkthrough.mp4", kind: "video", mimeType: "video/mp4", size: 18_874_368, url: null, uploadedById: "u_isha", createdAt: hoursAgo(20) },
    { ...base, id: "at_7", taskId: "t_web_6", commentId: null, name: "hero-v2.png", kind: "image", mimeType: "image/png", size: 640_000, url: "/mock/hero.svg", uploadedById: "u_isha", createdAt: hoursAgo(21) },
    { ...base, id: "at_8", taskId: null, commentId: null, name: "project-brief.pdf", kind: "pdf", mimeType: "application/pdf", size: 845_000, url: null, uploadedById: "u_shubham", createdAt: daysFromNow(-28) },
  ];
}
