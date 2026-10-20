import type { HarnessArchitectSynthesisResult } from './harnessArchitectAgent';

/** Browser only. Keys are passed for one request and never persisted or relayed. */
export async function refineHarness(base: HarnessArchitectSynthesisResult, options: {
  key: string; model: string; instructions: string; notes: string;
  videoBase64?: string; videoMimeType?: string;
}, send: typeof fetch = fetch): Promise<HarnessArchitectSynthesisResult> {
  if (!options.key.trim()) throw new Error('Enter your Gemini key.');
  if (!/^[a-zA-Z0-9._-]+$/.test(options.model)) throw new Error('Enter a valid Gemini model ID.');
  const parts: Array<Record<string, unknown>> = [];
  if (options.videoBase64) parts.push({ inlineData: { mimeType: options.videoMimeType || 'video/mp4', data: options.videoBase64 } });
  parts.push({ text: `Refine this agent harness plan using the instructions and optional video. Return JSON only with four non-empty string fields: refinedTitle, refinedSummary, substrateRationale, recursionRationale.\nInstructions:\n${options.instructions}\nNotes:\n${options.notes}` });
  let response: Response;
  try {
    response = await send(`https://generativelanguage.googleapis.com/v1beta/models/${options.model}:generateContent`, {
      method: 'POST', headers: { 'Content-Type': 'application/json', 'x-goog-api-key': options.key },
      body: JSON.stringify({ contents: [{ role: 'user', parts }], generationConfig: { responseMimeType: 'application/json' } }),
      redirect: 'error', signal: AbortSignal.timeout(90000), credentials: 'omit',
    });
  } catch { throw new Error('Gemini connection failed or timed out. Check your network and model settings.'); }
  // Do not echo provider error bodies: they can contain request details or credentials.
  if (!response.ok) throw new Error(`Gemini request failed (HTTP ${response.status}). Check your key, billing, and model access.`);
  let parsed: Record<string, unknown>;
  try {
    const data = await response.json();
    const text = data.candidates?.[0]?.content?.parts?.map((p: { text?: string }) => p.text || '').join('');
    parsed = JSON.parse(text || '');
    for (const field of ['refinedTitle', 'refinedSummary', 'substrateRationale', 'recursionRationale']) {
      if (typeof parsed[field] !== 'string' || !(parsed[field] as string).trim()) throw new Error('invalid');
    }
  } catch { throw new Error('Gemini returned no usable refinement. The previous harness has been kept.'); }
  const clean = (value: unknown) => String(value).split(options.key).join('[redacted]');
  return { ...base, title: clean(parsed.refinedTitle), summary: clean(parsed.refinedSummary), synthesisEngine: options.model,
    workflowDecision: { ...base.workflowDecision, substrateRationale: clean(parsed.substrateRationale), recursionRationale: clean(parsed.recursionRationale) } };
}
