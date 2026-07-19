"use client";

import { useCallback, useEffect, useState } from "react";
import type { CompanyDna } from "@/lib/company-dna";
import { fetchCompanyDna, updateCompanyDna } from "@/lib/knowledge/api";
import {
  FieldLabel,
  KnowledgeAlert,
  SaveButton,
  SectionCard,
  TextArea,
  TextInput,
  commaList,
  joinList,
} from "./KnowledgeUi";

function newId() {
  return crypto.randomUUID();
}

export default function CompanyDnaSection() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [dna, setDna] = useState<CompanyDna | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      setDna(await fetchCompanyDna());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load Company DNA.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const save = async () => {
    if (!dna) return;
    setSaving(true);
    setError("");
    setSuccess("");
    try {
      const updated = await updateCompanyDna({
        mission: dna.mission,
        values: dna.values,
        toneOfVoice: dna.toneOfVoice,
        riskProfile: dna.riskProfile,
        decisionPrinciples: dna.decisionPrinciples,
      });
      setDna(updated);
      setSuccess("Company DNA saved.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save Company DNA.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <SectionCard title="Company DNA" description="Loading…" />;
  }

  if (!dna) {
    return (
      <SectionCard title="Company DNA">
        {error && <KnowledgeAlert tone="error">{error}</KnowledgeAlert>}
      </SectionCard>
    );
  }

  return (
    <SectionCard
      title="Company DNA"
      description="How your company thinks and communicates."
      actions={<SaveButton onClick={() => void save()} saving={saving} />}
    >
      {error && <KnowledgeAlert tone="error">{error}</KnowledgeAlert>}
      {success && <KnowledgeAlert tone="success">{success}</KnowledgeAlert>}

      <div>
        <FieldLabel>Mission</FieldLabel>
        <TextArea
          value={dna.mission ?? ""}
          onChange={(mission) => setDna({ ...dna, mission })}
          placeholder="What your company exists to do"
        />
      </div>

      <div>
        <FieldLabel>Values (comma-separated names)</FieldLabel>
        <TextInput
          value={joinList(dna.values.map((v) => v.name))}
          onChange={(raw) =>
            setDna({
              ...dna,
              values: commaList(raw).map((name, i) => ({
                id: dna.values[i]?.id ?? newId(),
                name,
              })),
            })
          }
          placeholder="Integrity, Customer-first, Innovation"
        />
      </div>

      <div>
        <FieldLabel>Tone of voice summary</FieldLabel>
        <TextArea
          value={dna.toneOfVoice.summary ?? ""}
          onChange={(summary) =>
            setDna({ ...dna, toneOfVoice: { ...dna.toneOfVoice, summary } })
          }
          placeholder="Professional, direct, helpful…"
        />
      </div>

      <div>
        <FieldLabel>Tone personality traits (comma-separated)</FieldLabel>
        <TextInput
          value={joinList(dna.toneOfVoice.personality ?? [])}
          onChange={(raw) =>
            setDna({
              ...dna,
              toneOfVoice: { ...dna.toneOfVoice, personality: commaList(raw) },
            })
          }
        />
      </div>

      <div>
        <FieldLabel>Risk approach summary</FieldLabel>
        <TextArea
          value={dna.riskProfile.summary ?? ""}
          onChange={(summary) =>
            setDna({ ...dna, riskProfile: { ...dna.riskProfile, summary } })
          }
          placeholder="How the company approaches risk and escalation"
        />
      </div>

      <div>
        <FieldLabel>Decision principles (comma-separated)</FieldLabel>
        <TextInput
          value={joinList(dna.decisionPrinciples.map((p) => p.name))}
          onChange={(raw) =>
            setDna({
              ...dna,
              decisionPrinciples: commaList(raw).map((name, i) => ({
                id: dna.decisionPrinciples[i]?.id ?? newId(),
                name,
              })),
            })
          }
        />
      </div>
    </SectionCard>
  );
}
