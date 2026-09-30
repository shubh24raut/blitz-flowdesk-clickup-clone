"use client";

import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogBody, DialogContent, DialogFooter } from "@/components/ui/dialog";
import { wait } from "@/lib/utils";
import { createOrganization } from "@/store/actions/organizations";
import { WorkspaceForm } from "./workspace-form";

/** Creates a workspace owned by the current user and switches straight into it. */
export function CreateWorkspaceDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const router = useRouter();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent title="Create workspace" description="A separate space with its own clients, projects, team and time off." size="md">
        {open && (
          <WorkspaceForm
            idPrefix="create-workspace"
            onSubmit={async (values) => {
              await wait(300);
              const result = createOrganization(values);
              if (!result.ok) return result.error;
              onOpenChange(false);
              router.push("/dashboard");
              toast.success("Workspace created successfully", { description: `You're now in ${result.value.name}.` });
            }}
            renderBody={(fields) => (
              <DialogBody>
                {fields}
                <p className="mt-4 text-xs text-muted-foreground">You can change these later.</p>
              </DialogBody>
            )}
          >
            {({ isSubmitting }) => (
              <DialogFooter>
                <Button type="button" variant="secondary" onClick={() => onOpenChange(false)}>
                  Cancel
                </Button>
                <Button type="submit" loading={isSubmitting}>
                  Create Workspace
                </Button>
              </DialogFooter>
            )}
          </WorkspaceForm>
        )}
      </DialogContent>
    </Dialog>
  );
}
