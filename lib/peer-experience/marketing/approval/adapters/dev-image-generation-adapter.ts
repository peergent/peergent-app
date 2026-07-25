import type {
  GeneratedImageResult,
  ImageGenerationAdapter,
} from "./image-generation-adapter";

const ASPECT_DIMENSIONS: Record<string, { width: number; height: number }> = {
  "1:1": { width: 1080, height: 1080 },
  "4:5": { width: 1080, height: 1350 },
  "9:16": { width: 1080, height: 1920 },
  "1.91:1": { width: 1200, height: 628 },
  "16:9": { width: 1920, height: 1080 },
};

function buildPlaceholderSvg(
  prompt: string,
  width: number,
  height: number
): string {
  const label = prompt.slice(0, 48) || "Generated image";
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
    <defs>
      <linearGradient id="g" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" style="stop-color:#6366f1"/>
        <stop offset="100%" style="stop-color:#8b5cf6"/>
      </linearGradient>
    </defs>
    <rect width="100%" height="100%" fill="url(#g)"/>
    <text x="50%" y="45%" fill="white" font-family="system-ui,sans-serif" font-size="24" font-weight="600" text-anchor="middle">Generated placeholder</text>
    <text x="50%" y="55%" fill="rgba(255,255,255,0.85)" font-family="system-ui,sans-serif" font-size="14" text-anchor="middle">${label.replace(/[<>&"']/g, "")}</text>
  </svg>`;
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}

/** Development adapter — returns an explicit labelled placeholder, not a fake API success. */
export class DevImageGenerationAdapter implements ImageGenerationAdapter {
  async generate(input: {
    prompt: string;
    aspectRatio: string;
  }): Promise<GeneratedImageResult> {
    await new Promise((resolve) => setTimeout(resolve, 1200));

    if (!input.prompt.trim()) {
      return { status: "error", message: "Describe the image you want Emma to create." };
    }

    const dims = ASPECT_DIMENSIONS[input.aspectRatio] ?? ASPECT_DIMENSIONS["4:5"];
    const url = buildPlaceholderSvg(input.prompt, dims.width, dims.height);

    return {
      status: "success",
      url,
      thumbnailUrl: url,
      width: dims.width,
      height: dims.height,
      altText: `Generated placeholder: ${input.prompt.slice(0, 80)}`,
      localOnly: true,
    };
  }
}

export const defaultImageGenerationAdapter = new DevImageGenerationAdapter();
