export type GeminiPart = { text: string } | { inlineData: { mimeType: string; data: string } };
/** Server-only Google adapter. No API key in URLs, output, or browser bundles. */
export async function geminiJson(
  key: string,
  instructions: string,
  contents: { role: "user" | "model"; parts: GeminiPart[] }[],
  schema: unknown,
  signal?: AbortSignal,
): Promise<unknown> {
  const model = process.env["GEMINI_MODEL"] || "gemini-2.5-flash";
  if (!/^[a-zA-Z0-9._-]+$/.test(model)) throw new Error("Invalid Gemini model configuration");
  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`,
    {
      method: "POST",
      signal: signal ?? AbortSignal.timeout(45000),
      headers: { "Content-Type": "application/json", "x-goog-api-key": key },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: instructions }] },
        contents,
        generationConfig: {
          responseMimeType: "application/json",
          responseJsonSchema: schema,
          maxOutputTokens: 4096,
        },
      }),
    },
  );
  if (!response.ok) throw new Error(`Gemini service request failed (${response.status})`);
  const result = (await response.json()) as {
    candidates?: {
      finishReason?: string;
      content?: { parts?: { text?: string; thought?: boolean }[] };
    }[];
  };
  const candidate = result.candidates?.[0];
  if (candidate?.finishReason !== "STOP")
    throw new Error("Gemini did not return a complete answer");
  const text = candidate.content?.parts
    ?.filter((p) => !p.thought)
    .map((p) => p.text ?? "")
    .join("");
  if (!text) throw new Error("Gemini returned no answer");
  return JSON.parse(text);
}
