export type GeneratedImageResult =
  | {
      status: "success";
      url: string;
      thumbnailUrl?: string;
      width: number;
      height: number;
      altText?: string;
      localOnly?: boolean;
    }
  | {
      status: "error";
      message: string;
    };

export interface ImageGenerationAdapter {
  generate(input: {
    prompt: string;
    aspectRatio: string;
    brandContext?: unknown;
    campaignContext?: unknown;
  }): Promise<GeneratedImageResult>;
}

export type ImageGenerationState =
  | { phase: "idle" }
  | { phase: "generating" }
  | { phase: "success"; result: Extract<GeneratedImageResult, { status: "success" }> }
  | { phase: "error"; message: string };
