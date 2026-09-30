import { describe, expect, it } from "vitest";
import { invitationEmail, resetPasswordEmail } from "./emails";

describe("email templates", () => {
  it("escapes user-supplied names in the HTML", () => {
    const email = invitationEmail({
      to: "new@example.com",
      inviterName: "<script>alert(1)</script>",
      organizationName: "Acme & Co",
      role: "Member",
      url: "https://flowdesk.app/accept-invitation/abc",
    });
    expect(email.html).not.toContain("<script>");
    expect(email.html).toContain("&lt;script&gt;");
    expect(email.html).toContain("Acme &amp; Co");
    expect(email.subject).toBe("<script>alert(1)</script> invited you to Acme & Co on FlowDesk");
  });

  it("includes the action link in both HTML and text", () => {
    const url = "https://flowdesk.app/reset-password?token=t1&x=2";
    const email = resetPasswordEmail({ to: "a@example.com", name: "Ananya", url });
    expect(email.text).toContain(url);
    expect(email.html).toContain("https://flowdesk.app/reset-password?token=t1&amp;x=2");
  });
});
