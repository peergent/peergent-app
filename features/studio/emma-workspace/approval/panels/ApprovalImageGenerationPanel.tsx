"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";
import { PgAlcove } from "@/components/design-system";
import type { ImageGenerationAdapter } from "@/lib/peer-experience/marketing/approval/adapters/image-generation-adapter";
import { defaultImageGenerationAdapter } from "@/lib/peer-experience/marketing/approval/adapters/dev-image-generation-adapter";
import type { ApprovalMediaAsset } from "@/lib/peer-experience/marketing/approval/types";

const ASPECT_RATIOS = [
  { id: "1:1", label: "Instagram square (1:1)" },
  { id: "4:5", label: "Instagram portrait (4:5)" },
  { id: "9:16", label: "Story (9:16)" },
  { id: "1.91:1", label: "LinkedIn landscape (1.91:1)" },
  { id: "16:9", label: "Blog hero (16:9)" },
] as const;

export type ApprovalImageGenerationPanelProps = {
  open: boolean;
  onClose: () => void;
  onGenerated: (asset: ApprovalMediaAsset) => void;
  adapter?: ImageGenerationAdapter;
};

export default function ApprovalImageGenerationPanel({
  open,
  onClose,
  onGenerated,
  adapter = defaultImageGenerationAdapter,
}: ApprovalImageGenerationPanelProps) {
  const [prompt, setPrompt] = useState("");
  const [style, setStyle] = useState("On-brand, clean, professional");
  const [aspectRatio, setAspectRatio] = useState("4:5");
  const [brandColours, setBrandColours] = useState(true);
  const [includeLogo, setIncludeLogo] = useState(false);
  const [instructions, setInstructions] = useState("");
  const [phase, setPhase] = useState<"idle" | "generating" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleGenerate = async () => {
    setPhase("generating");
    setErrorMessage(null);
    const fullPrompt = [prompt, style, instructions].filter(Boolean).join(". ");
    const result = await adapter.generate({
      prompt: fullPrompt,
      aspectRatio,
      brandContext: { brandColours, includeLogo },
    });

    if (result.status === "error") {
      setPhase("error");
      setErrorMessage(result.message);
      return;
    }

    onGenerated({
      id: `media-gen-${Date.now()}`,
      type: "image",
      source: "generated",
      url: result.url,
      thumbnailUrl: result.thumbnailUrl,
      width: result.width,
      height: result.height,
      altText: result.altText,
      status: "ready",
      localOnly: result.localOnly,
    });
    setPhase("idle");
    onClose();
  };

  return (
    <PgAlcove open={open} title="Generate image" onClose={onClose}>
      <div className="emma-approval-panel">
        <label className="emma-approval-panel__field">
          <span>Image idea</span>
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            rows={3}
            className="emma-approval-panel__textarea pg-focus-premium"
            placeholder="Describe the visual Emma should create"
          />
        </label>
        <label className="emma-approval-panel__field">
          <span>Visual style</span>
          <input
            type="text"
            value={style}
            onChange={(e) => setStyle(e.target.value)}
            className="emma-approval-panel__input pg-focus-premium"
          />
        </label>
        <label className="emma-approval-panel__field">
          <span>Aspect ratio</span>
          <select
            value={aspectRatio}
            onChange={(e) => setAspectRatio(e.target.value)}
            className="emma-approval-panel__input pg-focus-premium"
          >
            {ASPECT_RATIOS.map((ratio) => (
              <option key={ratio.id} value={ratio.id}>
                {ratio.label}
              </option>
            ))}
          </select>
        </label>
        <label className="emma-approval-panel__check">
          <input
            type="checkbox"
            checked={brandColours}
            onChange={(e) => setBrandColours(e.target.checked)}
          />
          Include brand colours
        </label>
        <label className="emma-approval-panel__check">
          <input
            type="checkbox"
            checked={includeLogo}
            onChange={(e) => setIncludeLogo(e.target.checked)}
          />
          Include logo
        </label>
        <label className="emma-approval-panel__field">
          <span>Additional instructions</span>
          <textarea
            value={instructions}
            onChange={(e) => setInstructions(e.target.value)}
            rows={2}
            className="emma-approval-panel__textarea pg-focus-premium"
          />
        </label>

        {phase === "generating" && (
          <p className="emma-approval-panel__status" role="status" aria-live="polite">
            <Loader2 size={16} className="emma-spin" aria-hidden />
            Generating image…
          </p>
        )}
        {errorMessage && (
          <p className="emma-approval-panel__error" role="alert">
            {errorMessage}
          </p>
        )}

        <div className="emma-approval-panel__actions">
          <button type="button" className="emma-approval-panel__cancel pg-focus-premium" onClick={onClose}>
            Cancel
          </button>
          <button
            type="button"
            className="emma-approval-panel__save pg-focus-premium"
            disabled={phase === "generating" || !prompt.trim()}
            onClick={() => void handleGenerate()}
          >
            Generate image
          </button>
        </div>
      </div>
    </PgAlcove>
  );
}
