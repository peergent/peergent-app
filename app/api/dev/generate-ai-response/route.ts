import { NextResponse } from "next/server";
import {
  defaultAIRuntime,
  toDeveloperErrorMessage,
} from "@/lib/ai-runtime";
import type { AIRuntimeOptions } from "@/lib/ai-runtime";
import type { PromptPackage } from "@/lib/prompt-builder";

type GenerateAIResponseBody = {
  promptPackage: PromptPackage;
  options?: AIRuntimeOptions;
};

export async function POST(request: Request) {
  if (process.env.NODE_ENV !== "development") {
    return NextResponse.json({ error: "Not found." }, { status: 404 });
  }

  let body: GenerateAIResponseBody;

  try {
    body = (await request.json()) as GenerateAIResponseBody;
  } catch {
    return NextResponse.json(
      { error: "Invalid request body. Expected JSON with promptPackage." },
      { status: 400 }
    );
  }

  if (!body.promptPackage?.systemPrompt || !body.promptPackage?.taskPrompt) {
    return NextResponse.json(
      { error: "promptPackage with systemPrompt and taskPrompt is required." },
      { status: 400 }
    );
  }

  try {
    const response = await defaultAIRuntime.generateFromPromptPackage(
      body.promptPackage,
      body.options
    );

    if (!response.validated.success) {
      return NextResponse.json(
        {
          error: response.validated.warnings.join(" ") || "Invalid AI response.",
          response,
        },
        { status: 422 }
      );
    }

    return NextResponse.json({ response });
  } catch (error) {
    return NextResponse.json(
      { error: toDeveloperErrorMessage(error) },
      { status: 500 }
    );
  }
}
