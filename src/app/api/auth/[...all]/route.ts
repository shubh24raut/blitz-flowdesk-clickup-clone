import { toNextJsHandler } from "better-auth/next-js";
import { auth } from "@/lib/auth";

/** Better Auth endpoints: /api/auth/sign-up/email, /api/auth/sign-in/email, /api/auth/organization/*, … */
export const { GET, POST } = toNextJsHandler(auth);
