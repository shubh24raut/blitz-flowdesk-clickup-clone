"use client";

import { ListFilter, Plus, Trash2, UsersRound, X } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { ClientActions } from "@/components/clients/client-actions";
import { ClientFormDialog } from "@/components/clients/client-form-dialog";
import { LetterTile } from "@/components/shared/avatar";
import { ClientStatusBadge } from "@/components/shared/badges";
import { EmptyState } from "@/components/shared/empty-state";
import { PageHeader } from "@/components/shared/page-header";
import { SearchInput } from "@/components/shared/search-input";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { CLIENT_STATUSES } from "@/constants";
import { pluralize } from "@/lib/utils";
import { deleteClient, setClientStatus } from "@/store/actions/clients";
import { useWorkspace } from "@/store/hooks";
import type { Client, ClientStatus } from "@/types";

export default function ClientsPage() {
  const state = useWorkspace();
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<"all" | ClientStatus>("all");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Client | undefined>();
  const [deleting, setDeleting] = useState<Client[] | null>(null);

  const projectCounts = useMemo(() => {
    const map = new Map<string, number>();
    for (const p of state.projects) if (p.clientId) map.set(p.clientId, (map.get(p.clientId) ?? 0) + 1);
    return map;
  }, [state.projects]);

  const clients = useMemo(() => {
    const q = search.trim().toLowerCase();
    return state.clients.filter(
      (c) =>
        (status === "all" || c.status === status) &&
        (!q || [c.name, c.contactPerson, c.email, c.industry].some((v) => v.toLowerCase().includes(q))),
    );
  }, [state.clients, search, status]);

  const visibleSelected = clients.filter((c) => selected.has(c.id));
  const allSelected = clients.length > 0 && visibleSelected.length === clients.length;

  function toggle(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function openEdit(client: Client) {
    setEditing(client);
    setFormOpen(true);
  }

  return (
    <div className="mx-auto max-w-[1400px] space-y-5">
      <PageHeader
        title="Clients"
        description="Manage your clients and their projects."
        actions={
          <Button
            onClick={() => {
              setEditing(undefined);
              setFormOpen(true);
            }}
          >
            <Plus /> Add Client
          </Button>
        }
      />

      <div className="flex flex-wrap items-center gap-2">
        <SearchInput value={search} onChange={setSearch} placeholder="Search clients…" className="w-full sm:w-72" />
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="secondary" size="sm" className="h-9">
              <ListFilter /> {status === "all" ? "Filter" : status}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-44">
            <DropdownMenuLabel>Status</DropdownMenuLabel>
            <DropdownMenuRadioGroup value={status} onValueChange={(v) => setStatus(v as typeof status)}>
              <DropdownMenuRadioItem value="all">All statuses</DropdownMenuRadioItem>
              {CLIENT_STATUSES.map((s) => (
                <DropdownMenuRadioItem key={s} value={s}>
                  {s}
                </DropdownMenuRadioItem>
              ))}
            </DropdownMenuRadioGroup>
          </DropdownMenuContent>
        </DropdownMenu>
        {visibleSelected.length > 0 && (
          <div className="flex items-center gap-1.5 rounded-lg bg-primary-light px-2 py-1 text-sm text-primary">
            <span className="px-1 font-medium">{visibleSelected.length} selected</span>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="h-7 text-primary">
                  Set status
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-36">
                <DropdownMenuRadioGroup
                  value=""
                  onValueChange={(v) => {
                    visibleSelected.forEach((c) => setClientStatus(c.id, v as ClientStatus));
                    toast.success(`${pluralize(visibleSelected.length, "client")} marked ${v}`);
                  }}
                >
                  {CLIENT_STATUSES.map((s) => (
                    <DropdownMenuRadioItem key={s} value={s}>
                      {s}
                    </DropdownMenuRadioItem>
                  ))}
                </DropdownMenuRadioGroup>
              </DropdownMenuContent>
            </DropdownMenu>
            <Button variant="ghost" size="sm" className="h-7 text-red-500" onClick={() => setDeleting(visibleSelected)}>
              <Trash2 /> Delete
            </Button>
            <button type="button" aria-label="Clear selection" onClick={() => setSelected(new Set())} className="rounded p-1 hover:bg-card">
              <X className="size-3.5" />
            </button>
          </div>
        )}
      </div>

      {clients.length === 0 ? (
        <EmptyState
          icon={UsersRound}
          title={state.clients.length ? "No clients match" : "No clients yet"}
          description={state.clients.length ? "Try a different search or status filter." : "Add your first client to start linking projects."}
          action={
            <Button onClick={() => setFormOpen(true)}>
              <Plus /> Add Client
            </Button>
          }
        />
      ) : (
        <>
          {/* Desktop table */}
          <div className="hidden overflow-hidden rounded-2xl border border-border bg-card shadow-card md:block">
            <table className="w-full text-sm">
              <thead className="border-b border-border bg-muted/40 text-left text-xs text-muted-foreground">
                <tr>
                  <th className="w-12 py-3 pl-5">
                    <Checkbox
                      checked={allSelected ? true : visibleSelected.length ? "indeterminate" : false}
                      onCheckedChange={(v) => setSelected(v ? new Set(clients.map((c) => c.id)) : new Set())}
                      aria-label="Select all clients"
                    />
                  </th>
                  <th className="py-3 font-medium">Name</th>
                  <th className="py-3 font-medium">Contact Person</th>
                  <th className="hidden py-3 font-medium lg:table-cell">Email</th>
                  <th className="py-3 text-center font-medium">Projects</th>
                  <th className="py-3 font-medium">Status</th>
                  <th className="py-3 pr-5 text-right font-medium">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {clients.map((c) => (
                  <tr key={c.id} onClick={() => router.push(`/clients/${c.id}`)} className="cursor-pointer transition hover:bg-lavender">
                    <td className="py-3 pl-5" onClick={(e) => e.stopPropagation()}>
                      <Checkbox checked={selected.has(c.id)} onCheckedChange={() => toggle(c.id)} aria-label={`Select ${c.name}`} />
                    </td>
                    <td className="py-3">
                      <Link href={`/clients/${c.id}`} className="flex items-center gap-3 font-semibold" onClick={(e) => e.stopPropagation()}>
                        <LetterTile name={c.name} color={c.color} solid size="sm" />
                        {c.name}
                      </Link>
                    </td>
                    <td className="py-3 text-muted-foreground">{c.contactPerson}</td>
                    <td className="hidden py-3 text-muted-foreground lg:table-cell">{c.email}</td>
                    <td className="py-3 text-center tabular-nums">{projectCounts.get(c.id) ?? 0}</td>
                    <td className="py-3">
                      <ClientStatusBadge status={c.status} />
                    </td>
                    <td className="py-3 pr-5 text-right">
                      <div className="flex justify-end">
                        <ClientActions client={c} onEdit={() => openEdit(c)} onDelete={() => setDeleting([c])} />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile cards */}
          <ul className="space-y-3 md:hidden">
            {clients.map((c) => (
              <li key={c.id} className="flex items-start gap-3 rounded-2xl border border-border bg-card p-4 shadow-card">
                <Checkbox checked={selected.has(c.id)} onCheckedChange={() => toggle(c.id)} aria-label={`Select ${c.name}`} className="mt-2.5" />
                <Link href={`/clients/${c.id}`} className="flex min-w-0 flex-1 items-start gap-3">
                  <LetterTile name={c.name} color={c.color} solid size="md" />
                  <span className="min-w-0">
                    <span className="block truncate font-semibold">{c.name}</span>
                    <span className="block truncate text-xs text-muted-foreground">
                      {c.contactPerson} · {c.email}
                    </span>
                    <span className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
                      <ClientStatusBadge status={c.status} /> {pluralize(projectCounts.get(c.id) ?? 0, "project")}
                    </span>
                  </span>
                </Link>
                <ClientActions client={c} onEdit={() => openEdit(c)} onDelete={() => setDeleting([c])} />
              </li>
            ))}
          </ul>
        </>
      )}

      <ClientFormDialog open={formOpen} onOpenChange={setFormOpen} client={editing} />
      <ConfirmDialog
        open={deleting !== null}
        onOpenChange={(open) => !open && setDeleting(null)}
        title={deleting?.length === 1 ? `Delete ${deleting[0].name}?` : `Delete ${deleting?.length ?? 0} clients?`}
        description="Linked projects are kept but will no longer be associated with a client."
        confirmLabel="Delete"
        onConfirm={() => {
          deleting?.forEach((c) => deleteClient(c.id));
          setSelected(new Set());
          toast.success(deleting?.length === 1 ? "Client deleted" : `${deleting?.length} clients deleted`);
        }}
      />
    </div>
  );
}
