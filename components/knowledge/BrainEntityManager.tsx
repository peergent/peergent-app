"use client";

import { useCallback, useEffect, useState } from "react";
import {
  FieldLabel,
  ItemCard,
  KnowledgeAlert,
  SaveButton,
  SectionCard,
  TextArea,
  TextInput,
} from "./KnowledgeUi";

type FieldDef = {
  key: string;
  label: string;
  kind: "text" | "textarea";
  required?: boolean;
  placeholder?: string;
};

type BrainEntityManagerProps<T extends { id: string; name?: string; title?: string }> = {
  title: string;
  description: string;
  emptyLabel: string;
  addLabel: string;
  nameField: keyof T & string;
  fields: FieldDef[];
  loadItems: () => Promise<T[]>;
  createItem: (input: Record<string, string>) => Promise<T>;
  updateItem: (id: string, input: Record<string, string>) => Promise<T>;
  deleteItem: (id: string) => Promise<void>;
  buildCreateInput: (draft: Record<string, string>) => Record<string, unknown>;
  buildUpdateInput: (draft: Record<string, string>) => Record<string, unknown>;
};

function emptyDraft(fields: FieldDef[]): Record<string, string> {
  return Object.fromEntries(fields.map((f) => [f.key, ""]));
}

export default function BrainEntityManager<T extends { id: string; name?: string; title?: string }>({
  title,
  description,
  emptyLabel,
  addLabel,
  nameField,
  fields,
  loadItems,
  createItem,
  updateItem,
  deleteItem,
  buildCreateInput,
  buildUpdateInput,
}: BrainEntityManagerProps<T>) {
  const [items, setItems] = useState<T[]>([]);
  const [draft, setDraft] = useState<Record<string, string>>(() => emptyDraft(fields));
  const [edits, setEdits] = useState<Record<string, Record<string, string>>>({});
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const data = await loadItems();
      setItems(data);
      setEdits(
        Object.fromEntries(
          data.map((item) => [
            item.id,
            Object.fromEntries(
              fields.map((f) => [f.key, String((item as Record<string, unknown>)[f.key] ?? "")])
            ),
          ])
        )
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load items.");
    } finally {
      setLoading(false);
    }
  }, [fields, loadItems]);

  useEffect(() => {
    void load();
  }, [load]);

  const handleCreate = async () => {
    setCreating(true);
    setError("");
    setSuccess("");
    try {
      await createItem(buildCreateInput(draft) as Record<string, string>);
      setDraft(emptyDraft(fields));
      setSuccess("Item added.");
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to add item.");
    } finally {
      setCreating(false);
    }
  };

  const handleUpdate = async (id: string) => {
    setBusyId(id);
    setError("");
    setSuccess("");
    try {
      await updateItem(id, buildUpdateInput(edits[id] ?? {}) as Record<string, string>);
      setSuccess("Changes saved.");
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save item.");
    } finally {
      setBusyId(null);
    }
  };

  const handleDelete = async (id: string) => {
    setBusyId(id);
    setError("");
    try {
      await deleteItem(id);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete item.");
    } finally {
      setBusyId(null);
    }
  };

  const displayName = (item: T) =>
    String(item.name ?? item.title ?? "Untitled");

  if (loading) {
    return <SectionCard title={title} description="Loading…" />;
  }

  return (
    <SectionCard title={title} description={description}>
      {error && <KnowledgeAlert tone="error">{error}</KnowledgeAlert>}
      {success && <KnowledgeAlert tone="success">{success}</KnowledgeAlert>}

      {items.length === 0 && (
        <p className="text-sm text-slate-500">{emptyLabel}</p>
      )}

      {items.map((item) => (
        <ItemCard
          key={item.id}
          title={displayName(item)}
          onDelete={() => void handleDelete(item.id)}
          deleting={busyId === item.id}
        >
          {fields.map((field) => (
            <div key={field.key} className="mt-3 first:mt-0">
              <FieldLabel>{field.label}</FieldLabel>
              {field.kind === "textarea" ? (
                <TextArea
                  value={edits[item.id]?.[field.key] ?? ""}
                  onChange={(value) =>
                    setEdits((prev) => ({
                      ...prev,
                      [item.id]: { ...prev[item.id], [field.key]: value },
                    }))
                  }
                />
              ) : (
                <TextInput
                  value={edits[item.id]?.[field.key] ?? ""}
                  onChange={(value) =>
                    setEdits((prev) => ({
                      ...prev,
                      [item.id]: { ...prev[item.id], [field.key]: value },
                    }))
                  }
                />
              )}
            </div>
          ))}
          <div className="mt-3">
            <SaveButton
              label="Save"
              saving={busyId === item.id}
              onClick={() => void handleUpdate(item.id)}
            />
          </div>
        </ItemCard>
      ))}

      <div className="rounded-[14px] border border-dashed border-white/[0.08] p-4">
        <p className="text-sm font-medium text-slate-300">{addLabel}</p>
        {fields.map((field) => (
          <div key={field.key} className="mt-3">
            <FieldLabel>{field.label}</FieldLabel>
            {field.kind === "textarea" ? (
              <TextArea
                value={draft[field.key] ?? ""}
                onChange={(value) => setDraft((prev) => ({ ...prev, [field.key]: value }))}
                placeholder={field.placeholder}
              />
            ) : (
              <TextInput
                value={draft[field.key] ?? ""}
                onChange={(value) => setDraft((prev) => ({ ...prev, [field.key]: value }))}
                placeholder={field.placeholder}
              />
            )}
          </div>
        ))}
        <div className="mt-4">
          <SaveButton label={addLabel} saving={creating} onClick={() => void handleCreate()} />
        </div>
      </div>
    </SectionCard>
  );
}

export const PRODUCT_FIELDS: FieldDef[] = [
  { key: "name", label: "Name", kind: "text", required: true },
  { key: "description", label: "Description", kind: "textarea" },
  { key: "category", label: "Category", kind: "text" },
];

export const SERVICE_FIELDS: FieldDef[] = [
  { key: "name", label: "Name", kind: "text", required: true },
  { key: "description", label: "Description", kind: "textarea" },
  { key: "category", label: "Category", kind: "text" },
];

export const SEGMENT_FIELDS: FieldDef[] = [
  { key: "name", label: "Name", kind: "text", required: true },
  { key: "description", label: "Description", kind: "textarea" },
];

export const COMPETITOR_FIELDS: FieldDef[] = [
  { key: "name", label: "Name", kind: "text", required: true },
  { key: "website", label: "Website", kind: "text" },
];

export const PROCESS_FIELDS: FieldDef[] = [
  { key: "name", label: "Name", kind: "text", required: true },
  { key: "description", label: "Description", kind: "textarea" },
];

export const FACT_FIELDS: FieldDef[] = [
  { key: "subject", label: "Subject", kind: "text", required: true },
  { key: "predicate", label: "Predicate", kind: "text", required: true },
  { key: "value", label: "Value", kind: "text", required: true },
];

export const SOURCE_FIELDS: FieldDef[] = [
  { key: "title", label: "Title", kind: "text", required: true },
  { key: "summary", label: "Summary", kind: "textarea" },
  { key: "sourceUrl", label: "Source URL", kind: "text" },
];

export const GOAL_FIELDS: FieldDef[] = [
  { key: "title", label: "Title", kind: "text", required: true },
  { key: "description", label: "Description", kind: "textarea" },
];

export const CONTENT_FIELDS: FieldDef[] = [
  { key: "title", label: "Title", kind: "text", required: true },
  { key: "summary", label: "Summary", kind: "textarea" },
  { key: "channel", label: "Channel", kind: "text" },
];

function buildSimpleInput(draft: Record<string, string>, nameKey: string) {
  return {
    ...draft,
    metadata: {},
    sortOrder: 0,
    [nameKey]: draft[nameKey]?.trim(),
  };
}

export function buildBrainInput(draft: Record<string, string>) {
  return buildSimpleInput(draft, "name");
}

export function buildFactInput(draft: Record<string, string>) {
  return {
    subject: draft.subject?.trim(),
    predicate: draft.predicate?.trim(),
    value: draft.value?.trim(),
    confidence: "moderate" as const,
    verified: false,
    importance: "medium" as const,
    metadata: {},
    sortOrder: 0,
  };
}

export function buildSourceInput(draft: Record<string, string>) {
  return {
    title: draft.title?.trim(),
    sourceType: "manual_note" as const,
    summary: draft.summary?.trim(),
    sourceUrl: draft.sourceUrl?.trim(),
    metadata: {},
    sortOrder: 0,
  };
}

export function buildGoalInput(draft: Record<string, string>) {
  return {
    title: draft.title?.trim(),
    description: draft.description?.trim(),
    priority: 0,
    status: "active" as const,
    sortOrder: 0,
  };
}

export function buildContentInput(draft: Record<string, string>) {
  return {
    title: draft.title?.trim(),
    contentType: "other" as const,
    summary: draft.summary?.trim(),
    channel: draft.channel?.trim(),
    sortOrder: 0,
  };
}

export function buildUpdateFromDraft(draft: Record<string, string>) {
  const next: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(draft)) {
    if (value.trim()) next[key] = value.trim();
  }
  return next;
}
