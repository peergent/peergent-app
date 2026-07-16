"use client";

import { useState } from "react";
import { Bot, Building2, Globe2, Plus, X } from "lucide-react";
import { supabase } from "@/lib/supabase";

type NewPeerModalProps = {
  open: boolean;
  onClose: () => void;
  onSuccess?: () => void;
};

const roles = [
  "Sales",
  "Support",
  "Marketing",
  "Planning",
  "Finance",
  "Custom",
];

export default function NewPeerModal({
  open,
  onClose,
  onSuccess,
}: NewPeerModalProps) {
  const [name, setName] = useState("");
  const [role, setRole] = useState("Sales");
  const [website, setWebsite] = useState("");
  const [goal, setGoal] = useState("");
  const [saving, setSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  if (!open) {
    return null;
  }

  function resetForm() {
    setName("");
    setRole("Sales");
    setWebsite("");
    setGoal("");
    setErrorMessage("");
    setSuccessMessage("");
  }

  function handleClose() {
    if (saving) return;

    resetForm();
    onClose();
  }

  async function handleCreatePeer() {
    setErrorMessage("");
    setSuccessMessage("");

    if (!name.trim()) {
      setErrorMessage("Please enter a peer name.");
      return;
    }

    if (!website.trim()) {
      setErrorMessage("Please enter a company website.");
      return;
    }

    if (!goal.trim()) {
      setErrorMessage("Please describe what this peer should achieve.");
      return;
    }

    setSaving(true);

    const { error } = await supabase.from("peers").insert({
      name: name.trim(),
      role,
      website: website.trim(),
      objective: goal.trim(),
      status: "active",
    });

    setSaving(false);

    if (error) {
      console.error("Supabase insert error:", error);

      const details = [
        error.message,
        error.details,
        error.hint,
        error.code,
      ]
        .filter(Boolean)
        .join(" — ");

      setErrorMessage(details || "Failed to create AI Peer.");
      return;
    }

    setSuccessMessage("AI Peer created successfully.");
    onSuccess?.();

    window.setTimeout(() => {
      resetForm();
      onClose();
    }, 900);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
      <div className="w-full max-w-2xl overflow-hidden rounded-3xl border border-white/10 bg-[#0b1120] text-white shadow-2xl shadow-black/50">
        <div className="flex items-center justify-between border-b border-white/10 px-6 py-5">
          <div>
            <p className="text-sm font-medium text-violet-400">
              Create AI Peer
            </p>

            <h2 className="mt-1 text-2xl font-semibold">
              Add a new digital colleague
            </h2>
          </div>

          <button
            type="button"
            onClick={handleClose}
            disabled={saving}
            aria-label="Close modal"
            className="rounded-xl border border-white/10 bg-white/5 p-2 text-slate-400 transition hover:bg-white/10 hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
          >
            <X size={20} />
          </button>
        </div>

        <div className="space-y-6 p-6">
          <div>
            <label
              htmlFor="peer-name"
              className="text-sm font-medium text-slate-300"
            >
              Peer name
            </label>

            <div className="mt-2 flex items-center gap-3 rounded-xl border border-white/10 bg-white/[0.03] px-4 focus-within:border-violet-500/60">
              <Bot size={18} className="shrink-0 text-violet-400" />

              <input
                id="peer-name"
                type="text"
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder="For example: Sales Peer"
                className="h-12 w-full bg-transparent text-sm text-white outline-none placeholder:text-slate-600"
              />
            </div>
          </div>

          <div>
            <p className="text-sm font-medium text-slate-300">Role</p>

            <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3">
              {roles.map((item) => (
                <button
                  key={item}
                  type="button"
                  onClick={() => setRole(item)}
                  className={`rounded-xl border px-4 py-3 text-sm transition ${
                    role === item
                      ? "border-violet-500 bg-violet-500/15 text-white"
                      : "border-white/10 bg-white/[0.03] text-slate-400 hover:bg-white/[0.06] hover:text-white"
                  }`}
                >
                  {item}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label
              htmlFor="company-website"
              className="text-sm font-medium text-slate-300"
            >
              Company website
            </label>

            <div className="mt-2 flex items-center gap-3 rounded-xl border border-white/10 bg-white/[0.03] px-4 focus-within:border-violet-500/60">
              <Globe2 size={18} className="shrink-0 text-violet-400" />

              <input
                id="company-website"
                type="url"
                value={website}
                onChange={(event) => setWebsite(event.target.value)}
                placeholder="https://peergent.com"
                className="h-12 w-full bg-transparent text-sm text-white outline-none placeholder:text-slate-600"
              />
            </div>
          </div>

          <div>
            <label
              htmlFor="peer-goal"
              className="text-sm font-medium text-slate-300"
            >
              What should this peer achieve?
            </label>

            <div className="mt-2 flex gap-3 rounded-xl border border-white/10 bg-white/[0.03] p-4 focus-within:border-violet-500/60">
              <Building2
                size={18}
                className="mt-1 shrink-0 text-violet-400"
              />

              <textarea
                id="peer-goal"
                value={goal}
                onChange={(event) => setGoal(event.target.value)}
                placeholder="Example: Qualify website visitors and schedule appointments with our sales team."
                rows={4}
                className="w-full resize-none bg-transparent text-sm leading-6 text-white outline-none placeholder:text-slate-600"
              />
            </div>
          </div>

          {errorMessage && (
            <div className="rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-300">
              {errorMessage}
            </div>
          )}

          {successMessage && (
            <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-300">
              {successMessage}
            </div>
          )}
        </div>

        <div className="flex justify-end gap-3 border-t border-white/10 px-6 py-5">
          <button
            type="button"
            onClick={handleClose}
            disabled={saving}
            className="rounded-xl border border-white/10 bg-white/5 px-5 py-3 text-sm text-slate-300 transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={handleCreatePeer}
            disabled={saving}
            className="flex cursor-pointer items-center gap-2 rounded-xl bg-violet-600 px-6 py-3 text-sm font-medium text-white transition hover:bg-violet-500 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Plus size={18} />
            {saving ? "Creating..." : "Create AI Peer"}
          </button>
        </div>
      </div>
    </div>
  );
}