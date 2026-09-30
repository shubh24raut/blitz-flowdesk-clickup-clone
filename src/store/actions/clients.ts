import { uid } from "@/lib/utils";
import { getState, setState } from "@/store/store";
import type { Client, ClientContact, ClientStatus, ID } from "@/types";
import { activeOrgId, now, replaceById, withActivity, workspace } from "./internal";

export type ClientInput = Pick<
  Client,
  "name" | "contactPerson" | "email" | "phone" | "website" | "industry" | "address" | "status" | "color" | "notes"
>;

export function createClient(input: ClientInput): Client {
  const client: Client = {
    ...input,
    id: uid("c"),
    organizationId: activeOrgId(getState()),
    contacts: input.contactPerson
      ? [{ id: uid("cc"), name: input.contactPerson, role: "Primary contact", email: input.email, phone: input.phone }]
      : [],
    createdAt: now(),
  };
  setState((s) =>
    withActivity({ ...s, clients: [client, ...s.clients] }, { action: "added client", target: client.name, clientId: client.id }),
  );
  return client;
}

export function updateClient(id: ID, patch: Partial<Omit<Client, "id" | "organizationId">>) {
  setState((s) => {
    const client = s.clients.find((c) => c.id === id);
    if (!client) return s;
    const next = { ...s, clients: replaceById(s.clients, id, (c) => ({ ...c, ...patch })) };
    return withActivity(next, { action: "updated client", target: patch.name ?? client.name, clientId: id });
  });
}

export function setClientStatus(id: ID, status: ClientStatus) {
  const client = workspace().clients.find((c) => c.id === id);
  if (!client || client.status === status) return;
  setState((s) =>
    withActivity(
      { ...s, clients: replaceById(s.clients, id, (c) => ({ ...c, status })) },
      { action: "changed the status of", target: client.name, from: client.status, to: status, clientId: id },
    ),
  );
}

/** Deletes a client. Its projects are kept but unlinked. */
export function deleteClient(id: ID) {
  setState((s) => ({
    ...s,
    clients: s.clients.filter((c) => c.id !== id),
    projects: s.projects.map((p) => (p.clientId === id ? { ...p, clientId: null } : p)),
  }));
}

export function addClientContact(clientId: ID, contact: Omit<ClientContact, "id">) {
  setState((s) => ({
    ...s,
    clients: replaceById(s.clients, clientId, (c) => ({ ...c, contacts: [...c.contacts, { ...contact, id: uid("cc") }] })),
  }));
}

export function removeClientContact(clientId: ID, contactId: ID) {
  setState((s) => ({
    ...s,
    clients: replaceById(s.clients, clientId, (c) => ({ ...c, contacts: c.contacts.filter((x) => x.id !== contactId) })),
  }));
}
