"use client";

import { Building2, ChevronRight, FolderKanban, Globe, Mail, MapPin, Pencil, Phone, Plus, Trash2, UserRound, X } from "lucide-react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { ClientFormDialog } from "@/components/clients/client-form-dialog";
import { ProjectFormDialog } from "@/components/projects/project-form-dialog";
import { ActivityFeed } from "@/components/shared/activity-feed";
import { AvatarStack, LetterTile, UserAvatar } from "@/components/shared/avatar";
import { ClientStatusBadge, ProjectStatusBadge } from "@/components/shared/badges";
import { EmptyState } from "@/components/shared/empty-state";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Input, Textarea } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { formatLong } from "@/lib/dates";
import { pluralize } from "@/lib/utils";
import { addClientContact, deleteClient, removeClientContact, updateClient } from "@/store/actions/clients";
import { clientProjects, getUsers, projectProgress } from "@/store/selectors";
import { useAppState } from "@/store/hooks";
import type { Client } from "@/types";

export default function ClientDetailPage() {
  const { clientId } = useParams<{ clientId: string }>();
  const state = useAppState();
  const client = state.clients.find((c) => c.id === clientId);

  if (!client) {
    return (
      <EmptyState
        icon={Building2}
        title="Client not found"
        description="This client may have been deleted."
        action={
          <Button asChild>
            <Link href="/clients">Back to clients</Link>
          </Button>
        }
      />
    );
  }
  return <ClientDetail client={client} />;
}

function ClientDetail({ client }: { client: Client }) {
  const state = useAppState();
  const router = useRouter();
  const [editOpen, setEditOpen] = useState(false);
  const [projectOpen, setProjectOpen] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [notes, setNotes] = useState(client.notes);
  const [contactOpen, setContactOpen] = useState(false);
  const [contact, setContact] = useState({ name: "", role: "", email: "", phone: "" });
  const projects = clientProjects(state, client.id);
  const activities = useMemo(() => {
    const projectIds = new Set(state.projects.filter((p) => p.clientId === client.id).map((p) => p.id));
    return state.activities.filter((a) => a.clientId === client.id || (a.projectId && projectIds.has(a.projectId))).slice(0, 12);
  }, [state.activities, state.projects, client.id]);

  const details = [
    { icon: Mail, label: "Email", value: client.email, href: `mailto:${client.email}` },
    { icon: Phone, label: "Phone", value: client.phone, href: client.phone ? `tel:${client.phone}` : undefined },
    { icon: Globe, label: "Website", value: client.website.replace(/^https?:\/\//, ""), href: client.website || undefined },
    { icon: Building2, label: "Industry", value: client.industry },
    { icon: MapPin, label: "Address", value: client.address },
  ];

  function saveContact() {
    if (!contact.name.trim() || !/^\S+@\S+\.\S+$/.test(contact.email)) {
      toast.error("Add a name and a valid email");
      return;
    }
    addClientContact(client.id, contact);
    setContact({ name: "", role: "", email: "", phone: "" });
    setContactOpen(false);
    toast.success("Contact added");
  }

  return (
    <div className="mx-auto max-w-[1400px] space-y-6">
      <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-xs text-muted-foreground">
        <Link href="/clients" className="font-medium text-primary hover:underline">
          Clients
        </Link>
        <ChevronRight className="size-3.5" />
        <span className="text-foreground">{client.name}</span>
      </nav>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <LetterTile name={client.name} color={client.color} solid size="xl" />
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-2xl font-bold tracking-tight">{client.name}</h1>
              <ClientStatusBadge status={client.status} />
            </div>
            <p className="mt-1 text-sm text-muted-foreground">
              {client.industry || "Client"} · since {formatLong(client.createdAt)} · {pluralize(projects.length, "project")}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" onClick={() => setEditOpen(true)}>
            <Pencil /> Edit
          </Button>
          <Button variant="secondary" onClick={() => setConfirmDelete(true)} aria-label="Delete client">
            <Trash2 className="text-red-500" />
          </Button>
          <Button onClick={() => setProjectOpen(true)}>
            <Plus /> New project
          </Button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Projects</CardTitle>
              <span className="text-xs text-muted-foreground">{projects.length} total</span>
            </CardHeader>
            <CardContent className="pt-3">
              {projects.length === 0 ? (
                <EmptyState
                  compact
                  icon={FolderKanban}
                  title="No projects yet"
                  action={
                    <Button size="sm" onClick={() => setProjectOpen(true)}>
                      <Plus /> New project
                    </Button>
                  }
                />
              ) : (
                <ul className="divide-y divide-border">
                  {projects.map((p) => {
                    const progress = projectProgress(state, p.id);
                    return (
                      <li key={p.id}>
                        <Link href={`/projects/${p.id}/tasks`} className="flex flex-col gap-3 py-3.5 sm:flex-row sm:items-center">
                          <span className="flex min-w-0 flex-1 items-center gap-3">
                            <LetterTile name={p.name} color={p.color} />
                            <span className="min-w-0">
                              <span className="block truncate text-sm font-semibold hover:text-primary">{p.name}</span>
                              <span className="block text-xs text-muted-foreground">Due {formatLong(p.dueDate)}</span>
                            </span>
                          </span>
                          <span className="flex items-center gap-4">
                            <span className="w-32">
                              <span className="mb-1 block text-right text-xs font-medium">{progress.percent}%</span>
                              <Progress value={progress.percent} color={p.color} />
                            </span>
                            <ProjectStatusBadge status={p.status} />
                            <AvatarStack users={getUsers(state, p.memberIds)} max={3} />
                          </span>
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              )}
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Activity</CardTitle>
            </CardHeader>
            <CardContent>
              <ActivityFeed activities={activities} emptyText="Updates to this client and its projects will appear here." />
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Company details</CardTitle>
            </CardHeader>
            <CardContent>
              <dl className="space-y-3.5">
                {details.map((d) => (
                  <div key={d.label} className="flex items-start gap-3 text-sm">
                    <d.icon className="mt-0.5 size-4 shrink-0 text-subtle" />
                    <div className="min-w-0">
                      <dt className="text-xs text-muted-foreground">{d.label}</dt>
                      <dd className="truncate font-medium">
                        {d.value ? (
                          d.href ? (
                            <a href={d.href} target={d.label === "Website" ? "_blank" : undefined} rel="noreferrer" className="hover:text-primary">
                              {d.value}
                            </a>
                          ) : (
                            d.value
                          )
                        ) : (
                          <span className="text-subtle">—</span>
                        )}
                      </dd>
                    </div>
                  </div>
                ))}
              </dl>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Contacts</CardTitle>
              <Button variant="secondary" size="sm" onClick={() => setContactOpen((v) => !v)}>
                <Plus /> Add
              </Button>
            </CardHeader>
            <CardContent className="space-y-3">
              {contactOpen && (
                <div className="space-y-2 rounded-xl border border-border bg-muted/40 p-3">
                  <Input placeholder="Full name" value={contact.name} onChange={(e) => setContact({ ...contact, name: e.target.value })} aria-label="Contact name" />
                  <Input placeholder="Role" value={contact.role} onChange={(e) => setContact({ ...contact, role: e.target.value })} aria-label="Contact role" />
                  <Input placeholder="Email" type="email" value={contact.email} onChange={(e) => setContact({ ...contact, email: e.target.value })} aria-label="Contact email" />
                  <Input placeholder="Phone" value={contact.phone} onChange={(e) => setContact({ ...contact, phone: e.target.value })} aria-label="Contact phone" />
                  <div className="flex justify-end gap-2">
                    <Button variant="ghost" size="sm" onClick={() => setContactOpen(false)}>
                      Cancel
                    </Button>
                    <Button size="sm" onClick={saveContact}>
                      Save contact
                    </Button>
                  </div>
                </div>
              )}
              {client.contacts.length === 0 && !contactOpen && <p className="text-sm text-muted-foreground">No contacts yet.</p>}
              <ul className="space-y-3">
                {client.contacts.map((c) => (
                  <li key={c.id} className="group flex items-center gap-3">
                    <UserAvatar user={{ name: c.name, color: client.color }} size="md" />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">
                        {c.name} {c.role && <span className="text-xs font-normal text-muted-foreground">· {c.role}</span>}
                      </p>
                      <a href={`mailto:${c.email}`} className="block truncate text-xs text-muted-foreground hover:text-primary">
                        {c.email}
                      </a>
                    </div>
                    <button
                      type="button"
                      aria-label={`Remove ${c.name}`}
                      onClick={() => {
                        removeClientContact(client.id, c.id);
                        toast.success("Contact removed");
                      }}
                      className="rounded-md p-1 text-subtle opacity-100 hover:text-red-500 sm:opacity-0 sm:group-hover:opacity-100"
                    >
                      <X className="size-4" />
                    </button>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Notes</CardTitle>
              <UserRound className="size-4 text-subtle" />
            </CardHeader>
            <CardContent className="space-y-2">
              <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={5} placeholder="Add private notes about this client…" aria-label="Client notes" />
              {notes !== client.notes && (
                <div className="flex justify-end gap-2">
                  <Button variant="ghost" size="sm" onClick={() => setNotes(client.notes)}>
                    Discard
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => {
                      updateClient(client.id, { notes });
                      toast.success("Notes saved");
                    }}
                  >
                    Save notes
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      <ClientFormDialog open={editOpen} onOpenChange={setEditOpen} client={client} />
      <ProjectFormDialog open={projectOpen} onOpenChange={setProjectOpen} defaultClientId={client.id} />
      <ConfirmDialog
        open={confirmDelete}
        onOpenChange={setConfirmDelete}
        title={`Delete ${client.name}?`}
        description={`${pluralize(projects.length, "project")} will be kept but unlinked from this client.`}
        confirmLabel="Delete client"
        onConfirm={() => {
          router.push("/clients");
          deleteClient(client.id);
          toast.success("Client deleted");
        }}
      />
    </div>
  );
}
