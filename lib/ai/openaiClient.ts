export type OpenAiDraftingConfig =
  | { enabled: true; apiKey: string; model: string }
  | { enabled: false; reason: string; missing: "OPENAI_API_KEY" | "OPENAI_MODEL" };

export type OpenAiJsonResponseRequest = {
  instructions: string;
  input: string;
  schemaName: string;
  schema: Record<string, unknown>;
  maxOutputTokens?: number;
};

export function getOpenAiDraftingConfig(env: NodeJS.ProcessEnv = process.env): OpenAiDraftingConfig {
  if (!env.OPENAI_API_KEY?.trim()) {
    return { enabled: false, reason: "OPENAI_API_KEY is not configured.", missing: "OPENAI_API_KEY" };
  }
  if (!env.OPENAI_MODEL?.trim()) {
    return { enabled: false, reason: "OPENAI_MODEL is not configured.", missing: "OPENAI_MODEL" };
  }
  return { enabled: true, apiKey: env.OPENAI_API_KEY, model: env.OPENAI_MODEL };
}

export function extractResponseText(responseBody: unknown) {
  if (!responseBody || typeof responseBody !== "object") return "";
  const body = responseBody as { output_text?: unknown; output?: unknown };
  if (typeof body.output_text === "string") return body.output_text;
  if (!Array.isArray(body.output)) return "";

  return body.output
    .flatMap((item) => {
      if (!item || typeof item !== "object") return [];
      const content = (item as { content?: unknown }).content;
      return Array.isArray(content) ? content : [];
    })
    .map((content) => {
      if (!content || typeof content !== "object") return "";
      const text = (content as { text?: unknown }).text;
      return typeof text === "string" ? text : "";
    })
    .filter(Boolean)
    .join("\n");
}

export async function createOpenAiJsonResponse(request: OpenAiJsonResponseRequest, config = getOpenAiDraftingConfig()) {
  if (!config.enabled) {
    throw new Error(config.reason);
  }

  const response = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${config.apiKey}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      model: config.model,
      instructions: request.instructions,
      input: request.input,
      store: false,
      temperature: 0.2,
      max_output_tokens: request.maxOutputTokens ?? 1600,
      text: {
        format: {
          type: "json_schema",
          name: request.schemaName,
          strict: true,
          schema: request.schema
        }
      }
    })
  });

  const body = (await response.json()) as unknown;
  if (!response.ok) {
    const message = body && typeof body === "object" && "error" in body ? JSON.stringify((body as { error: unknown }).error) : response.statusText;
    throw new Error(`OpenAI response failed: ${message}`);
  }

  return {
    body,
    outputText: extractResponseText(body),
    model: config.model
  };
}
