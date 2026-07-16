"use client";

import { useEffect, useState } from "react";
import { Bot, Building2, Globe2, Save, X } from "lucide-react";
import {
  PEER_ROLES,
  PEER_STATUSES,
  type PeerRow,
} from "@/lib/peer-display";
import { supabase } from "@/lib/supabase";

type EditPeerModalProps = {
  open: boolean;
  peer: PeerRow;
  onClose: () => void;
  onSuccess?: () => void;
};

export default function EditPeerModal({
  open,
  peer,
  onClose,
  onSuccess,
}: EditPeerModalProps) {
  const [name, setName] = useState(peer.name);
  const [role, setRole] = useState(peer.role);
  const [website, setWebsite] = useState(peer.website);
  const [objective, setObjective] = useState(peer.objective);
  const [status, setStatus] = useState(peer.status);
  const [saving, setSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  useEffect(() => {
    if (!open) {
      return;
    }

    setName(peer.name);
    setRole(peer.role);
    setWebsite(peer.website);
    setObjective(peer.objective);
    setStatus(peer.status);
    setErrorMessage("");
    setSuccessMessage("");
  }, [open, peer]);

  if (!open) {
    return null;
  }

  function handleClose() {
    if (saving) {
      return;
    }

    onClose();
  }

  async function handleSavePeer() {
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

    if (!objective.trim()) {
      setErrorMessage("Please describe what this peer should achieve.");
      return;
    }

    setSaving(true);

    const { error } = await supabase
      .from("peers")
      .update({
        name: name.trim(),
        role,
        website: website.trim(),
        objective: objective.trim(),
        status,
      })
      .eq("id", peer.id);

    setSaving(false);

    if (error) {
      console.error("Supabase update error:", error);

      const details = [
        error.message,
        error.details,
        error.hint,
        error.code,
      ]
        .filter(Boolean)
        .join(" — ");

      setErrorMessage(details || "Failed to update AI Peer.");
      return;
    }

    setSuccessMessage("AI Peer updated successfully.");
    onSuccess?.();

    window.setTimeout(() => {
      onClose();
    }, 900);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
      <div className="w-full max-w-2xl overflow-hidden rounded-3xl border border-white/10 bg-[#0b1120] text-white shadow-2xl shadow-black/50">
        <div className="flex items-center justify-between border-b border-white/10 px-6 py-5">
          <div>
            <p className="text-sm font-medium text-violet-400">Edit AI Peer</p>

            <h2 className="mt-1 text-2xl font-semibold">
              Update digital colleague
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
              htmlFor="edit-peer-name"
              className="text-sm font-medium text-slate-300"
            >
              Peer name
            </label>

            <div className="mt-2 flex items-center gap-3 rounded-xl border border-white/10 bg-white/[0.03] px-4 focus-within:border-violet-500/60">
              <Bot size={18} className="shrink-0 text-violet-400" />

              <input
                id="edit-peer-name"
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
              {PEER_ROLES.map((item) => (
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
            <p className="text-sm font-medium text-slate-300">Status</p>

            <div className="mt-3 grid grid-cols-2 gap-3">
              {PEER_STATUSES.map((item) => (
                <button
                  key={item}
                  type="button"
                  onClick={() => setStatus(item)}
                  className={`rounded-xl border px-4 py-3 text-sm capitalize transition ${
                    status === item
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
              htmlFor="edit-company-website"
              className="text-sm font-medium text-slate-300"
            >
              Company website
            </label>

            <div className="mt-2 flex items-center gap-3 rounded-xl border border-white/10 bg-white/[0.03] px-4 focus-within:border-violet-500/60">
              <Globe2 size={18} className="shrink-0 text-violet-400" />

              <input
                id="edit-company-website"
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
              htmlFor="edit-peer-objective"
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
                id="edit-peer-objective"
                value={objective}
                onChange={(event) => setObjective(event.target.value)}
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
            onClick={handleSavePeer}
            disabled={saving}
            className="flex cursor-pointer items-center gap-2 rounded-xl bg-violet-600 px-6 py-3 text-sm font-medium text-white transition hover:bg-violet-500 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Save size={18} />
            {saving ? "Saving..." : "Save changes"}
          </button>
        </div>
      </div>
    </div>
  );
}
