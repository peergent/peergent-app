"use client";

import { useCallback, useEffect, useState } from "react";
import type { BrandPositioning } from "@/lib/knowledge/api";
import { fetchMarketingProfile, updateMarketingProfile } from "@/lib/knowledge/api";
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

export default function BrandPositioningSection() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [brand, setBrand] = useState<BrandPositioning>({
    keyMessages: [],
  });

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const profile = await fetchMarketingProfile();
      setBrand(profile.brandPositioning);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load brand positioning.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const save = async () => {
    setSaving(true);
    setError("");
    setSuccess("");
    try {
      await updateMarketingProfile({ brandPositioning: brand });
      setSuccess("Brand positioning saved.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save brand positioning.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <SectionCard title="Brand positioning" description="Loading…" />;
  }

  return (
    <SectionCard
      title="Brand positioning"
      description="Marketing positioning used by the Marketing Peer."
      actions={<SaveButton onClick={() => void save()} saving={saving} />}
    >
      {error && <KnowledgeAlert tone="error">{error}</KnowledgeAlert>}
      {success && <KnowledgeAlert tone="success">{success}</KnowledgeAlert>}

      <div>
        <FieldLabel>Positioning statement</FieldLabel>
        <TextArea
          value={brand.positioningStatement ?? ""}
          onChange={(positioningStatement) => setBrand({ ...brand, positioningStatement })}
        />
      </div>
      <div>
        <FieldLabel>Value proposition</FieldLabel>
        <TextArea
          value={brand.valueProposition ?? ""}
          onChange={(valueProposition) => setBrand({ ...brand, valueProposition })}
        />
      </div>
      <div>
        <FieldLabel>Tagline</FieldLabel>
        <TextInput
          value={brand.tagline ?? ""}
          onChange={(tagline) => setBrand({ ...brand, tagline })}
        />
      </div>
      <div>
        <FieldLabel>Market category</FieldLabel>
        <TextInput
          value={brand.marketCategory ?? ""}
          onChange={(marketCategory) => setBrand({ ...brand, marketCategory })}
        />
      </div>
      <div>
        <FieldLabel>Key messages (comma-separated)</FieldLabel>
        <TextInput
          value={joinList(brand.keyMessages)}
          onChange={(raw) => setBrand({ ...brand, keyMessages: commaList(raw) })}
        />
      </div>
    </SectionCard>
  );
}
