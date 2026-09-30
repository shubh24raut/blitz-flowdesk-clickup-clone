"use client";

import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogBody, DialogContent, DialogFooter } from "@/components/ui/dialog";
import { wait } from "@/lib/utils";
import { updateOrganization } from "@/store/actions/organizations";
import type { Organization } from "@/types";
import { WorkspaceForm } from "./workspace-form";

/** Rename / re-brand any workspace the user administers, without switching to it. */
export function EditWorkspaceDialog({ organization, onOpenChange }: { organization: Organization | null; onOpenChange: (open: boolean) => void }) {
  return (
    <Dialog open={organization !== null} onOpenChange={onOpenChange}>
      <DialogContent title="Edit workspace" description={organization?.name} size="md">
        {organization && (
          <WorkspaceForm
            organization={organization}
            idPrefix="edit-workspace"
            onSubmit={async (values) => {
              await wait(300);
              const result = updateOrganization(organization.id, values);
              if (!result.ok) return result.error;
              toast.success("Workspace updated");
              onOpenChange(false);
            }}
            renderBody={(fields) => <DialogBody>{fields}</DialogBody>}
          >
            {({ isSubmitting, isDirty }) => (
              <DialogFooter>
                <Button type="button" variant="secondary" onClick={() => onOpenChange(false)}>
                  Cancel
                </Button>
                <Button type="submit" loading={isSubmitting} disabled={!isDirty}>
                  Save changes
                </Button>
              </DialogFooter>
            )}
          </WorkspaceForm>
        )}
      </DialogContent>
    </Dialog>
  );
}
